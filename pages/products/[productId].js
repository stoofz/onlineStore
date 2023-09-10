/* eslint-disable func-style */
import prisma from 'utils/prisma';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

import { averageRating } from 'utils/rating';
// import { getReviews } from 'utils/reviews';
import { handleAddToCart } from 'utils/cart';
import { addToWishlist, deleteFromWishlist } from 'utils/wishlist';
import { useSessionId } from '/utils/session';
import ReviewForm from '../../components/ReviewForm';


import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Rating from '@mui/material/Rating';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';

const ProductDetailsPage = ({ product, reviews: defaultReviews, user }) => {
  const [openForm, setOpenForm] = useState(false);
  const [reviews, setReviews] = useState(defaultReviews);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [heartColor, setHeartColor] = useState('gray');
console.log("isInWishlist TOP", isInWishlist)
  const userId = useSessionId();


//----------------REVIEW LOGIC-----------------
  const handleFormOpen = () => {
    if (!user) {
      // User is not logged in, show an alert or perform any other action
      alert('Please log in to leave a review.');
    } else {
      setOpenForm(true);
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setComment();
    setRating(0);
  };

  //SAVE reviews to feedback table in db
  const saveReviewToDb = async (newReview) => {
    try {
      const response = await axios.post('/api/saveReview', newReview, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        // Review saved successfully, you can update the UI or take other actions.
        console.log('Review saved successfully');
      } else {
        // Handle errors, e.g., show an error message to the user.
        console.error('Failed to save the review');
      }
    } catch (error) {
      console.error('An error occurred while saving the review:', error);
    }
  };

  // Handle the review submission,
  const handleReviewSubmit = (rating, comment) => {

    // Check if rating is 0 or comment is empty
    if (!comment || comment.trim() === '') {
      // Show an error message to the user or handle the validation error
      alert('Please provide a rating and comment before submitting.');
      return; // Prevent further execution of the function
    }

    const newReview = {
      date: new Date(),
      rating: rating,
      comment: comment,
      firstName: user.firstName,
      lastName: user.lastName,
      customerId: user.id,
      productId: product.id,

    };

    //Update reviews object, add new review
    setReviews([...reviews, newReview]);
    handleFormClose(); // Close the form after submission
    setComment();
    setRating(0);
    saveReviewToDb(newReview);
  };

  // Function to handle review deletion from db and update UI
  const deleteReviewFromDb = async (id) => {
    try {
      // Show an alert to confirm before deleting
      const confirmDelete = window.confirm('Are you sure you want to delete this review?');

      if (confirmDelete) {
        // Send a DELETE request to the API route
        const response = await axios.delete('/api/deleteReview', { data: { id } });

        if (response.status === 200) {
          // Update the UI by removing the deleted review from the state
          setReviews(reviews.filter((review) => review.id !== id));
          console.log('Review deleted successfully');
        } else {
          // Handle error
          console.error('Failed to delete the review');
        }
      } else {
        console.log('Review deletion canceled');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  //-------------------WISHLIST LOGIC --------------------

  

  const checkIfProductIsInWishlist = async (productId, userId) => {
    try {
      // Make an API request to check if the product is in the wishlist
      const response = await axios.get(`/api/wishlist?productId=${productId}&userId=${userId}`);
      const isInWishlist = response.data.isInWishlist;
      setIsInWishlist(isInWishlist);
      return isInWishlist
     
    } catch (error) {
      console.error('Error checking if product is in wishlist:', error);
    }
  };

  


  const handleAddToWishlist = async( userId, productId) => {

    try {
      // Check if the product is already in the wishlist
      const trueList = await checkIfProductIsInWishlist(userId, product.id);
      console.log("trueList ", trueList)
      if (trueList) {
        // Product is already in the wishlist, don't add it again
        console.log('Product is already in the wishlist.');
      } else {
        // Product is not in the wishlist, add it
        const result = await addToWishlist( userId, productId);
        console.log("LINE 184", result)
        if (result.success) {
          // Product added to wishlist successfully
          setIsInWishlist(true);
        }
      }
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
    }
  };
  
  const handleDeleteFromWishlist = async (userId, productId) => {
    const result = await deleteFromWishlist(userId, productId);
    console.log("result", result);
    if (result.success) {
      // Update the wishlist state by filtering out the deleted item
      // const updatedWishlist = wishlistData.filter((item) => item.productId !== productId);

      setWishlistData(result.data.data); // Update wishlistData here
    } else {
      console.error('Error deleting item from wishlist:', result.error);
    }
  };

  // Function to add or remove the product from the wishlist
  const handleToggleWishlist = async (productId, userId) => {
    try {
      if (isInWishlist) {
        // If the product is in the wishlist, remove it
        const result = await deleteFromWishlist(userId, productId);
        if (result.success) {
          setIsInWishlist(false);
          // setHeartColor('gray'); // Change the heart color to gray
        } else {
          console.error('Error removing item from wishlist:', result.error);
        }
      } else {
        // If the product is not in the wishlist, add it
        const result = await addToWishlist(productId, userId);
        if (result.success) {
          setWishlistData(result.data.data);
          // setHeartColor('red'); // Change the heart color to red
        }
      }
    } catch (error) {
      console.error('Error toggling item in the wishlist:', error);
    }
  };


  useEffect(() => {
    // Call the function to check if the product is in the wishlist
    checkIfProductIsInWishlist(product.id, userId);
  }, [product.id, userId]);




  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <main>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p>{product.price}</p>
        <AddShoppingCartIcon onClick={() => handleAddToCart(product.id, userId)} />

        {/* Conditionally render the heart icon based on isInWishlist */}
        {/* {userId ? (
          isInWishlist ? (
            <FavoriteIcon
              style={{ margin: '20px', color: 'red' }}
              onClick={handleRemoveFromWishlist}
            />
          ) : (
            <FavoriteIcon
              style={{ margin: '20px', color: 'gray' }}
                onClick={handleAddToWishlist(product.id, userId)}
            />
          )
        ) : (
          <div>
            <p>Please log in to add items to your wishlist.</p>
            <Link href="/login">Log in</Link>
          </div>
        )} */}
        {/* <FavoriteIcon style={{ margin: '20px' }} onClick={() => handleAddToWishlist(product.id, userId)} /> */}

        <FavoriteIcon
          style={{
            margin: '20px',
            color: isInWishlist ? 'red' : 'gray', // Change color based on isInWishlist
          }}
          onClick={() => handleAddToWishlist(userId, product.id)}
        />




        <Rating name="read-only" value={averageRating(reviews)} readOnly precision={0.5} />
      </main>
      <div style={{ display: 'flex', justifyContent: 'center' }}>

        <Button
          onClick={handleFormOpen}
          startIcon={<AddIcon />}
          variant="outlined"
          style={{ backgroundColor: 'lightblue', color: 'white', borderColor: 'transparent' }}

        >
          Please Rate and Review!
        </Button>

      </div>
      <ReviewForm
        open={openForm}
        onClose={handleFormClose}
        onSubmit={handleReviewSubmit}
        comment={comment}
        setComment={setComment}
        rating={rating}
        setRating={setRating}
      />

      <section style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Customer Reviews
        </Typography>
        <Paper elevation={6} >
          <List>
            {reviews.length === 0 ? ( // Check if there are no reviews
              <Typography variant="body1" style={{ paddingLeft: '10px' }}>No reviews available.</Typography>
            ) : (
            reviews
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort reviews by date in descending order
              .map((review, index) => (
                <div key={index}>

                  <ListItem alignItems="flex-start">
                    <Avatar style={{ marginRight: '8px' }}>{review.firstName}</Avatar>
                    <ListItemText
                      primary={
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <Typography variant="body1" style={{ marginRight: '8px' }}>
                              {review.firstName} {review.lastName}
                            </Typography>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Rating
                                name="read-only"
                                value={review.rating}
                                precision={0.5}
                                readOnly
                                sx={{ fontSize: '18px' }}
                              />
                            </div>
                          </div>
                          <div style={{ fontSize: '14px', color: '#777' }}>{new Date(review.date).toLocaleDateString("en-CA")}</div>
                          <div style={{ fontSize: '14px', color: '#777', marginTop: '8px' }}>{review.comment}</div>

                        </div>
                      }
                    />

                    {user && user.id === review.customerId && ( // Check if user is logged in and owns this review
                      <Button
                        onClick={() => deleteReviewFromDb(review.id)}
                        style={{ backgroundColor: 'lightpink', color: 'white', borderColor: 'transparent' }}
                      >
                        <DeleteIcon /> Delete
                      </Button>
                    )}
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </div>
              )))}
          </List>
        </Paper>
      </section>
    </div>
  );
};

export async function getServerSideProps({ req, params }) {
  const productId = params.productId;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) }
  });
  const serializedProduct = JSON.parse(JSON.stringify(product));


  const reviews = await prisma.feedback.findMany({
    where: { productId: parseInt(productId) },
    include: { customer: true }
  });

  const extractedReviews = reviews.map((review) => {
    const { id, customerId, date, rating, comment } = review;
    const { firstName, lastName } = review.customer;

    return {
      id,
      customerId,
      date,
      rating,
      comment,
      firstName,
      lastName,
    };
  });

  const serializedReviews = JSON.parse(JSON.stringify(extractedReviews));
 

  const sessionId = req.cookies.sessionId || null;
  const userId = parseInt(sessionId);
  let user = null;

  // Check if userId is a valid number before fetching the user
  if (!isNaN(userId)) {
    user = await prisma.customer.findUnique({
      where: {
        id: userId,
      },
    });
  }

  return { props: { product: serializedProduct, reviews: serializedReviews, user: user || null } };
}

export default ProductDetailsPage;
