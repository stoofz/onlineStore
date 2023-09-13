/* eslint-disable func-style */
import prisma from 'utils/prisma';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

import { averageRating } from 'utils/rating';
import { handleAddToCart } from 'utils/cart';
import { useSessionId } from '/utils/session';
import ReviewForm from '../../components/ReviewForm';


import Paper from '@mui/material/Paper';
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
import { styled } from '@mui/material/styles';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Image from 'material-ui-image';
import Typography from '@mui/material/Typography';
import formatPrice from '@/utils/formatPrice';
import { useWishlist } from '../../utils/wishlistContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

import { useUser } from '@auth0/nextjs-auth0/client';

import { setSession, clearSession } from 'utils/session';

import Footer from '../../components/Footer';
import Products from '../../components/Products';
import Navigation from '../../components/Navigation';


// import { handleAddToWishlist, showLoginToast } from '@/utils/loginToast';
import { useWishlistFunctions } from '@/utils/loginToast';

const applyDiscountToProduct = async (productId, productPrice) => {
  try {
    const payload = {
      productId,
      productPrice,
    };

    // only full path works with port 3000, works on 127.0.0.1:80 by default
    const response = await axios.post('http://127.0.0.1:3000/api/applyDiscount', payload);

    if (response.status === 200) {
      const data = await response.data;
      return data.discountedPrice;
    }
  } catch (error) {
    console.error('Error applying discount:', error);
  }
};


const ProductDetailsPage = ({ product, reviews: defaultReviews, user }) => {
  const [openForm, setOpenForm] = useState(false);
  const [reviews, setReviews] = useState(defaultReviews);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const { wishlist, isInWishlist, addToWishlist, deleteFromWishlist } = useWishlist();

  const userId = useSessionId();
  const { handleAddToWishlist, showLoginToast } = useWishlistFunctions();
  //-------------------WISHLIST LOGIC --------------------
  const textToastFav = "Please log in to add items to your wishlist.";


  //---------------------CART LOGIC------------------------
  //additional fn to check if user is logged in before adding to cart
  const textToastCart = "Please log in to add items to your cart.";

  const handleAddToCartToast = (productId, userId, textToast) => {
    if (userId) {
      handleAddToCart(productId, userId);
    } else {
      // User is not logged in, show a toast notification
      showLoginToast(textToast);
    }
  };


  //----------------REVIEW LOGIC-----------------

  const handleFormOpen = () => {
    if (!user) {
      // User is not logged in, show an alert or perform any other action
      showLoginToast('Please log in to leave a review.');

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
        return response.data;
      } else {
        // Handle errors, e.g., show an error message to the user.
        console.error('Failed to save the review');
      }
    } catch (error) {
      console.error('An error occurred while saving the review:', error);
    }
  };

  // Handle the review submission,
  const handleReviewSubmit = async (rating, comment) => {

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
    const returnedReveiew = await saveReviewToDb(newReview);
    setReviews([...reviews, returnedReveiew]);
    handleFormClose(); // Close the form after submission
    setComment();
    setRating(0);

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


  if (!product) {
    return <div>Loading...</div>;
  }

  if (user) {

    return (
      <>
        <Navigation sessionId={setSession(user)} />
        <main>
          <h3>{product.name}</h3>
          <p>{product.description}</p>

          <p> {product.price !== product.originalPrice ? (
            <span>
              <span style={{ textDecoration: 'line-through', color: 'red' }}> ${(product.originalPrice / 100).toFixed(2)} </span> {' '} ${(product.price / 100).toFixed(2)}
            </span>) : (`$${(product.price / 100).toFixed(2)}`)}
          </p>
          <AddShoppingCartIcon onClick={() => handleAddToCartToast(product.id, userId, textToastCart)} />


          {/* //---------------FAV ICON------------------------------ */}
          {/* Conditionally render the heart icon based on isInWishlist */}
          {/* {userId && wishlist ? (
            <FavoriteIcon
          style={{
            margin: '20px',
              color: isInWishlist( product.id) ? 'red' : 'gray', // Change color based on isInWishlist
          }}
          onClick={() => handleToggleWishlist(userId, product.id)}
        />
        ) : (
          <div>
            <p>Please log in to add items to your wishlist.</p>
            <Link href="/login">Log in</Link>
          </div>
        )} */}
          <div>
            {/* Always display the favorite icon */}
            <Button
              style={{
                width: 'fit-content',
                // visibility: 'hidden',
                color: '#324E4B' // Set the color here
              }}
              variant="text"
              type="button"
              className="icon-button"
              onClick={() => handleAddToWishlist(userId, product, textToastFav)}
            >
              {isInWishlist(product.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </Button>
            {/* Render the ToastContainer */}
            <ToastContainer position="top-right" autoClose={2000} />
          </div>




          <Rating name="read-only" value={averageRating(reviews)} readOnly precision={0.5} />
        </main>

        <div style={{ display: 'flex', justifyContent: 'center' }}>

          <Button
            onClick={handleFormOpen}
            startIcon={<AddIcon />}
            variant="outlined"
            style={{ backgroundColor: 'lightblue', color: 'white', borderColor: 'transparent', marginBottom: '40px' }}

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

          <List>
            {reviews.length === 0 ? (
              <Typography variant="body1" style={{ paddingLeft: '10px' }}>
                No reviews available.
              </Typography>
            ) : (
              reviews
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((review, index) => (
                  // <div key={index} style={{ marginBottom: '10px' }}>
                  <Paper key={index} elevation={6} style={{ marginBottom: '10px' }}>
                    <Card key={index} style={{ minHeight: '150px' }}>
                      <CardContent style={{ height: '150px', overflowY: 'auto' }} >
                        <ListItem alignItems="flex-start">
                          <Avatar style={{ marginRight: '8px' }}>{review.firstName}</Avatar>
                          <ListItemText
                            primary={
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                  }}
                                >
                                  <Typography variant="body1" style={{ marginRight: '8px' }}>
                                    {review.firstName} {review.lastName}
                                  </Typography>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>

                                  </div>
                                </div>
                                <div style={{ fontSize: '14px', color: '#777' }}>
                                  {new Date(review.date).toLocaleDateString('en-CA')}
                                </div>
                                <div style={{ fontSize: '14px', color: '#777', marginTop: '8px' }}>
                                  {review.comment}
                                </div>
                              </div>
                            }
                          />

                          {user && user.id === review.customerId && (
                            <Button
                              sx={{
                                minWidth: 'unset', // Remove the minimum width
                              }}
                              onClick={() => {
                                console.log("review.id", review.id);
                                deleteReviewFromDb(review.id);
                              }
                              }
                              style={{ backgroundColor: 'lightpink', color: 'white', borderColor: 'transparent' }}
                            >
                              <DeleteIcon /> Delete
                            </Button>
                          )}
                        </ListItem>
                      </CardContent>
                    </Card>
                  </Paper>


                ))
            )}
          </List>
        </section>
        <Footer />
      </>
    );
  };

  return (
    <>
      <Navigation />
      <main>
        <h3>{product.name}</h3>
        <p>{product.description}</p>

        <p> {product.price !== product.originalPrice ? (
          <span>
            <span style={{ textDecoration: 'line-through', color: 'red' }}> ${(product.originalPrice / 100).toFixed(2)} </span> {' '} ${(product.price / 100).toFixed(2)}
          </span>) : (`$${(product.price / 100).toFixed(2)}`)}
        </p>
        <AddShoppingCartIcon onClick={() => handleAddToCartToast(product.id, userId, textToastCart)} />


        {/* //---------------FAV ICON------------------------------ */}
        {/* Conditionally render the heart icon based on isInWishlist */}
        {/* {userId && wishlist ? (
          <FavoriteIcon
        style={{
          margin: '20px',
            color: isInWishlist( product.id) ? 'red' : 'gray', // Change color based on isInWishlist
        }}
        onClick={() => handleToggleWishlist(userId, product.id)}
      />
      ) : (
        <div>
          <p>Please log in to add items to your wishlist.</p>
          <Link href="/login">Log in</Link>
        </div>
      )} */}
        <div>
          {/* Always display the favorite icon */}
          <Button
            style={{
              width: 'fit-content',
              // visibility: 'hidden',
              color: '#324E4B' // Set the color here
            }}
            variant="text"
            type="button"
            className="icon-button"
            onClick={() => handleAddToWishlist(userId, product, textToastFav)}
          >
            {isInWishlist(product.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </Button>
          {/* Render the ToastContainer */}
          <ToastContainer position="top-right" autoClose={2000} />
        </div>




        <Rating name="read-only" value={averageRating(reviews)} readOnly precision={0.5} />
      </main>

      <div style={{ display: 'flex', justifyContent: 'center' }}>

        <Button
          onClick={handleFormOpen}
          startIcon={<AddIcon />}
          variant="outlined"
          style={{ backgroundColor: 'lightblue', color: 'white', borderColor: 'transparent', marginBottom: '40px' }}

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

        <List>
          {reviews.length === 0 ? (
            <Typography variant="body1" style={{ paddingLeft: '10px' }}>
              No reviews available.
            </Typography>
          ) : (
            reviews
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((review, index) => (
                // <div key={index} style={{ marginBottom: '10px' }}>
                <Paper key={index} elevation={6} style={{ marginBottom: '10px' }}>
                  <Card key={index} style={{ minHeight: '150px' }}>
                    <CardContent style={{ height: '150px', overflowY: 'auto' }} >
                      <ListItem alignItems="flex-start">
                        <Avatar style={{ marginRight: '8px' }}>{review.firstName}</Avatar>
                        <ListItemText
                          primary={
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '8px',
                                }}
                              >
                                <Typography variant="body1" style={{ marginRight: '8px' }}>
                                  {review.firstName} {review.lastName}
                                </Typography>
                                <div style={{ display: 'flex', alignItems: 'center' }}>

                                </div>
                              </div>
                              <div style={{ fontSize: '14px', color: '#777' }}>
                                {new Date(review.date).toLocaleDateString('en-CA')}
                              </div>
                              <div style={{ fontSize: '14px', color: '#777', marginTop: '8px' }}>
                                {review.comment}
                              </div>
                            </div>
                          }
                        />

                        {user && user.id === review.customerId && (
                          <Button
                            sx={{
                              minWidth: 'unset', // Remove the minimum width
                            }}
                            onClick={() => {
                              console.log("review.id", review.id);
                              deleteReviewFromDb(review.id);
                            }
                            }
                            style={{ backgroundColor: 'lightpink', color: 'white', borderColor: 'transparent' }}
                          >
                            <DeleteIcon /> Delete
                          </Button>
                        )}
                      </ListItem>
                    </CardContent>
                  </Card>
                </Paper>


              ))
          )}
        </List>
      </section>
      <Footer />
    </>
  );
}

export async function getServerSideProps({ req, params }) {
  const productId = params.productId;
  const productItem = await prisma.product.findUnique({
    where: { id: parseInt(productId) }
  });


  let product = {};

  if (productItem) {
    const price = Number(await applyDiscountToProduct(productItem.id, productItem.price));
    const originalPrice = Number(productItem.price);

    product = {
      ...productItem,
      price,
      originalPrice
    };

  }
  console.log('Product:', product);


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
