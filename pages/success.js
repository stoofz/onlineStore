import axios from 'axios';

// import prisma from 'utils/prisma';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Stripe } from 'stripe';

import { CircularProgress, Card } from "@mui/material";
const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

// import { useSearchParams } from 'next/navigation';

const Success = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const userId = 3; 
  console.log("orderDetails", orderDetails)
  useEffect(() => {
    if (session_id) {
      // Fetch order details based on the session ID
      const fetchOrderDetails = async () => {
        try {
          const response = await axios.get(`/api/success?session_id=${session_id}&userId=${userId}`);
          if (response.status === 200) {
            setOrderDetails(response.data);
            
          }
        } catch (error) {
          console.error('Error fetching order details', error);
        }
      };

      fetchOrderDetails();
      
    }
  }, [session_id]);

  if (!orderDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }
  console.log("orderDetails.order.id", orderDetails.order.id)
  // Check if payment was successful
  const paymentSuccessful = orderDetails.orderDetailsSession.paymentStatus === 'paid';

  return (
    <div className="container mx-auto mt-8">
      {paymentSuccessful ? (
        <>
          <h1 className="text-3xl text-green-500 mb-4">Payment Successful! Thank you for your order!</h1>

          <Card className="p-4 border border-gray-300 rounded shadow-md">
            <p className="mb-4">
              Your Order # <strong>{orderDetails.orderDetailsSession.orderNumber}</strong>
            </p>
            <p>
              Total Price: <strong>{orderDetails.orderDetailsSession.totalPrice} CAD</strong>
            </p>
            <p>
              Customer Name: <strong>{orderDetails.orderDetailsSession.customerName}</strong>
            </p>
            <p>
              Customer Email: <strong>{orderDetails.orderDetailsSession.customerEmail}</strong>
            </p>
            <p>
              Payment Method: <strong>{orderDetails.orderDetailsSession.paymentMethod}</strong>
            </p>
            <p>
              Payment Status: <strong>{orderDetails.orderDetailsSession.paymentStatus}</strong>
            </p>

            <div className="mt-4">

              <Link href={`/orders/${orderDetails.order.id}`}>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  View Order
                </button>
              </Link>


              
            </div>
          </Card>
        </>
      ) : (
        <>
        <div className="text-red-500 text-2xl">
          Payment Unsuccessful. Please try again later.
        </div>
        
          <div className="mt-4">
              <button
                onClick={() => {
                
                  router.push('/cart');  // Redirect to cart page
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2"
              >
                Retry Payment
              </button>
              </div>
          </>

      )}
    </div>
  );
};

export default Success;

// const Success = () => {

//   const router = useRouter();
//   const { session_id } = router.query;
//   console.log("STATUS", session_id)
//   // const searchParams = useSearchParams();
//   // const params = searchParams.get('session_id');
 

//   return (
//     <>
//       {/* {status && status === 'success' && (
//         <div className='bg-green-100 text-green-700 p-2 rounded border mb-2 border-green-700'>
//           Payment Successful
//         </div>
//       )}
//       {status && status === 'cancel' && (
//         <div className='bg-red-100 text-red-700 p-2 rounded border mb-2 border-red-700'>
//           Payment Unsuccessful
//         </div>
//       )} */}
//       <h1>Thank you for your order #{params}!</h1>
//     </>
//   )
// }

// //not working as expected
// const orderSuccess = async () => {

//   const searchParams = useSearchParams();
//   const params = searchParams.get('session_id');

//   try {
//     const payload = {
//       params
//     };
//     // only extract through data
//     const response = await axios.get('/api/success', { data: payload });

//     if (response.status === 200) {
//       return response;
//     }
//   } catch (error) {
//     console.error('Error fetching order details', error);
//   }
// };

// export async function getServerSideProps() {

//   let props = {}

//   try {

//     const searchParams = useSearchParams();
//     const params = searchParams.get('session_id');
//     const orderItems = async () => {
//       await stripe.checkout.sessions.retrieve(
//         params,
//         {
//           expand: ['line_items']
//         });
//     }
//     props = { orderItems };

//   } catch (error) {
//     console.error('Error fetching order details', error);
//     //     // return { props: { cartItems: [] } };
//   }
//   return props;
// }


// export default Success;
