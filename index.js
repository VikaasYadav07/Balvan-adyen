const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");
const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const http = require('http');


var admin = require('firebase-admin');
const { Console } = require("console");
const { SHOPPER_REFERENCE, getAll, put, remove } = require('./storage.js')
// Load your service account key JSON file
var serviceAccount = {
  "type": "service_account",
  "project_id": "balvan-51353",
  "private_key_id": "37c3d27f6ba4704a5035446bbb4679ccd8034658",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3itAuOYb/hh3U\nbndgttWHqm1LBx+ac8gOE1lxy4w0iV6TAPzdPRdxb4kP1eG/5CXowELS5tp0x1qR\niDAA4s6lgbwldHg39yGZDkd4TcpfsIZoqxtpa9GZnEUh6MBNiEXkxpKG9kbTq0iF\n/6TVVsvW4xb1BRZMYhr+f959tJ+tt/kFoKZ2aP/Z2PId2JXBQG9K9kyvLun2cXrf\nwfVvveZnGOm8OE6J6QduPJFfUSA7cy1ADZd+ElqP3Uv//Ln0brilQkJsZVyyHVb7\nvDitKc9R5s6Tl1zgDg8HHjOd3HoNWrbZfLd2zMrcOCKE0qp1QCJg0CNxEa+mhe/N\n4mIiM6O9AgMBAAECggEAAi091/SYCS1H0m2dVop8LZ6qw3EfbHJdK8g69trQLmLA\nxmHsI+Pwu1SGol4cO/OaJ35OtDHNdUI8L+GpHo7nYaK7A0KDZkpTWtLDrCEat1Hm\noBSuRa/LqQthgAj5keu6xKoBRDKVzipdMt73STJVqFlUWl7JXD8d/bJPej05Gj3T\nazxaxc7rbuv98rug2EaTcsB45kZilNMeMkPijva7Yo/rSxc/Z0ksBee1baJtCl6z\nBhCcqNi/r0Fzqlb4zZNIb3d5//3ZUHPqf59vnizMif7Tly0ybAWcI/BTCsxcCEtm\nujjAdbV2tqlkv1BS8JhQveUNU1dqA3T2HgRjs8gLwQKBgQD147mkOhY3OwD0bXrR\n/C/uLmIZanDc8+OLdmNvYqo3BVGKwwK+8+oHKjFuIZWfWimy7FgSVcbjET0Q5F75\nlb0Cl6JbUdYOEC3Qi+zrnWken9Viv49tkuTW91GR2gITt7D5IPqF4THSn4pmgB5s\nqL6uAJNJpsaiK9aFboYmSiNE2QKBgQC/Fs9KjLJ9CvD80qKJ3QhgbWEnGjDsXU8c\nySR4oMZfL2D/8E9/MU0d/l4rrROdijL3dLwesoMQurL35AJZ1WV7Tb1ofJL0eUDF\nO2IC+KdMHectr5J3OnRrR1Nh569e337WUACy5C2CuEx/dqCdfAIIpjn4fvv3C8oX\n/Vq58+B3hQKBgC+lR8SNyN483at/R0xHHJZ/gFzCZko6K/5LG2tq5+avbiSAMxkD\nNHbc8yUO9uog03GrIEm1O0umfHm4drrQDAbjkP829U5WTjpZ0re5EbRwbi2rRsSJ\nsTQCSlkDsGFXt8AeZszoXPoeFfhUnRCbBg+7Zs7ftR+ZdQD38KCcvwbJAoGBAI4o\nNvA7+XEC2cMMJDUxxVCPLq57UpgU1o0Qqlw/JzSat6vPqCR0le1RVddiO+yAamgj\nZOvlW5HvgsLd0k3obkWr0NPRkTXkmqXgBos1VqhOurQHIIwoZYGFn2d/h7ypwd9H\nxy1OiPjtiKNuqhBet9idaRUPyvy/vYnZRkx+PKhNAoGAdujkryAX7nmw8W/tmw3s\nw4JPKV9xvFmguK8P05ElXvECTUw1o9jf+1TDtoMr6RashSO4sN+w/fRq/GiYgTdl\nF8fitqWLgL+y0g3uXeKhMqF0BXPFm+yp9RY7+9/eVsMe9e+DIKzYzJCPGQKKUT4R\nYcCFTDEEoyZmpIi0I23vWjQ=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-qub4j@balvan-51353.iam.gserviceaccount.com",
  "client_id": "101705280963194709608",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-qub4j%40balvan-51353.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};


// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

var userID, amount;
// init app
const app = express();
// setup request logging
app.use(morgan("dev"));
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve client from build folder
app.use(express.static(path.join(__dirname, "/public")));

// enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
  path: "./.env",
}); 1234

// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");  // change to LIVE for production
const checkout = new CheckoutAPI(client);
const cookieParser = require('cookie-parser');
app.engine(
  "handlebars",
  hbs.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts",
    helpers: require("./util/helpers"),
  })
);

app.set("view engine", "handlebars");
/*function fetchPublicIP() {123456
  
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        resolve(JSON.parse(data).ip);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}*/
/* ################# API ENDPOINTS ###################### */

// Invoke /sessions endpoint
/*
app.post("/api/sessions", async (req, res) => {
  console.log(req.body);
  try {

    // unique ref for the transaction
    const orderRef = uuid();
    // Allows for gitpod support
    const localhost = req.get('host');
    // const isHttps = req.connection.encrypted;
    const protocol = req.socket.encrypted ? 'https' : 'http';
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.PaymentsApi.sessions({
      amount: {
        currency: req.body.currency, value: req.body.key2 * 100,
 }, // value is 100€ in minor units
      countryCode: "NL",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef,

      metadata: {
        "checkout_id": req.body.checkout_id
      },
      shopperReference: req.body.key1,
      shoppername: req.body.shoppername,
      shopperemail:req.body.shopperemail,
      shopperip:req.body.shopperip,
      shoppercountry:req.body.shoppercountry,
      shopperbillingaddress:req.body.shopperbillingaddress,
      shopperdeliveryaddress:req.body.shopperdeliveryaddress,
      optionaldata:req.body.optionaldata,
      basketitem:req.body.basket

      returnUrl: `${protocol}://${localhost}/checkout?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
      // set lineItems required for some payment methods (ie Klarna)

    });

    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});
*/

app.post("/api/sessions", async (req, res) => {
  console.log(req.body);
  try {
    const userId = req.body.key1;


    //  const serverPublicIP = await fetchPublicIP();
    //   console.log(`Server's Public IP Address: ${serverPublicIP}`);



    // Query the Firestore database for the user document with userId
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract user data from the document
    const user = userDoc.data();


    // unique ref for the transaction
    const orderRef = uuid();
    // Allows for gitpod support
    const localhost = req.get('host');
    const protocol = req.socket.encrypted ? 'https' : 'http';

    const response = await checkout.PaymentsApi.sessions({
      amount: {
        currency: req.body.currency, value: req.body.key2 * 100,
      }, // value is 100€ in minor units
      countryCode: "NL",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef,
      metadata: {
        "checkout_id": req.body.checkout_id,
        "payment_type": req.body.paymentType
      },
      shopperReference: userId,
      shoppername: user.name,
      shopperemail: user.email,
      shopperip: '12345678',
      shoppercountry: user.country,
      shopperbillingaddress: user.address_line_1,
      shopperdeliveryaddress: user.address_line_1,
      basketitem: user.basketItem,
      returnUrl: `${protocol}://${localhost}/checkout?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
    });

    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});
app.use(cookieParser());

// Checkout page (make a payment)
app.get('/', async (req, res) => {


  userID = req.query.userid;


  if (typeof userID !== 'string' || userID.trim() === '') {
    return res.status(400).send('User ID must be a non-empty string.');
  }

  console.log(`UserID: ${userID}`);

  try {
    // Assuming user_id is stored in a collection 'users'
    const userDoc = await db.collection('users').doc(userID).get();
    if (userDoc.exists) {
      console.log("Successfully retrieved user document.");
      let decimalAmount = parseFloat(req.query.amount);
      let integerAmount = Math.round(decimalAmount * 1);

      // ... proceed with your logic
      res.render("checkout", {
        type: "card",
        amount: integerAmount,
        userid: req.query.userid,
        language: req.query.language,
        checkoutid: req.query.checkoutid,
        currency: req.query.currency,
        paymentType: req.query.paymentType,
        clientKey: process.env.ADYEN_CLIENT_KEY
      });

    } else {
      res.status(404).send('User ID does not exist in the database.');
    }
    const checkdat = await db.collection('users').doc(userID).collection('checkout').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data()}`);
      });
    });


  } catch (error) {
    console.error('Error retrieving user document: ', error);
    res.status(500).send('Error verifying user ID: ' + error.message);
  }
});
app.post("/api/tokenization/sessions", async (req, res) => {

  try {
    const userId = req.body.key1;


    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract user data from the document
    const user = userDoc.data();
    // unique ref for the transaction
    const orderRef = uuid();
    const host = req.get('host');
    const protocol = req.socket.encrypted ? 'https' : 'http';

    // perform /sessions call
    const response = await checkout.PaymentsApi.sessions({
      amount: { currency: req.body.currency, value: req.body.key2 * 100 }, // zero-auth transaction
      countryCode: "NL",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef, // required: your Payment Reference
      shopperReference: req.body.key1,
      metadata: {
        "checkout_id": req.body.checkout_id,
        "payment_type": req.body.paymentType
      },

      returnUrl: `${protocol}://${host}/checkout?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
      channel: "Web",
      // recurring payment settings
      shopperInteraction: "Ecommerce",
      shoppername: user.name,
      shopperemail: user.email,
      shopperip: '12345678',
      // shoppercountry: user.country,
      shopperbillingaddress: user.address_line_1,
      shopperdeliveryaddress: user.address_line_1,
      // basketitem: user.basketItem,
      recurringProcessingModel: "Subscription",
      enableRecurring: true
    });

    console.log(response);

    res.json(response);

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }

});
app.get("/subscription", async (req, res) => {
  userID = req.query.userid;

  console.log(`subscription: ${JSON.stringify(req.query)}`);

  // Check if userID is actually provided and is a string
  if (typeof userID !== 'string' || userID.trim() === '') {
    return res.status(400).send('User ID must be a non-empty string.');
  }

  // console.log(`UserID: ${userID}`);

  try {
    // Assuming user_id is stored in a collection 'users'
    const userDoc = await db.collection('users').doc(userID).get();
    console.log(userDoc.data());

    if (userDoc.exists) {
      console.log("Successfully retrieved user document.");
      let decimalAmount = parseFloat(req.query.amount);
      let integerAmount = Ma
      th.round(decimalAmount * 1);
      // ... proceed wit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            h your logic

      res.render("subscription", {
        type: "card",
        amount: integerAmount,
        userid: req.query.userid,
        currency: req.query.currency,
        language: req.query.language,
        checkoutid: req.query.checkoutid,

        paymentType: req.query.paymentType,
        clientKey: process.env.ADYEN_CLIENT_KEY
      })


    } else {
      res.status(404).send('User ID does not exist in the database.');
    }
  } catch (error) {
    console.error('Error retrieving user document: ', error);
    res.status(500).send('Error verifying user ID: ' + error.message);
  }
});
app.get("/checkout", (req, res) =>
  res.render("checkout", {
    type: req.query.type,
    clientKey: process.env.ADYEN_CLIENT_KEY
  })
);
app.get("/result/:type", async (req, res) => {
  console.log("result result " + JSON.stringify(req.params));
  var parts = req.params.type.split(',');

  // Assign the parts to separate variables
  var part1 = parts[0]; // Contains "success"
  var part2 = parts[1];
  userID = part2;
  console.log("USERRRRRRRRRRRRRR");
  if (userID != null) {
    try {
      // Adding a 2-second delay
      // Update the user's payment status
      /*res.render("result", {
             type: part1,
           });*/

      // After successful update, send the response
      // res.send({ result: "Success", type: req.params.type });

    } catch (error) {
      // Handle any errors
      console.error('Error:', error);
      res.status(500).send({ error: error.message });
    }
  } else {
    res.status(400).send({ error: "Invalid user ID" });
  }
});
app.post("/api/webhooks/notifications/", async (req, res) => {

  try {
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    const validator = new hmacValidator();

    const notificationRequest = req.body;
    const notificationRequestItems = notificationRequest.notificationItems;

    if (!notificationRequestItems || notificationRequestItems.length === 0) {
      throw new Error("No notification items found");
    }

    const notification = notificationRequestItems[0].NotificationRequestItem;
    console.log("XXXXXXXXXXX=>>>>>>>");

    console.log(notification);
    if (!validator.validateHMAC(notification, hmacKey)) {
      console.log("Invalid HMAC signature");
      return res.status(401).send('Invalid HMAC signature');
    }


    await processNotification(notification);
    res.status(200).send('[accepted]');
  }
  catch (error) {
    console.error('Error processing webhook notification:', error);
    res.status(500).send('Internal Server Error');
  }
});
// process payload asynchronously
function consumeEvent(notification) {
  // add item to DB, queue or different thread

}
async function processNotification(notification) {
  try {
    if (notification.amount) {
      await saveTransaction(notification);
    }


    // Consume event asynchronously (replace with actual consumeEvent function)
    await consumeEvent(notification);
  } catch (error) {
    console.error('Error in processing notification:', error);
    throw error; // rethrow the error to be caught by the caller
  }
}
async function saveTransaction(notification) {
  const userId = notification.additionalData.shopperReference;
  console.log("Notification transaction for user: " + userId);

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      console.log('User document does not exist');
      return;
    }

    if (notification.additionalData['metadata.payment_type'] == "shop") {
      const checkoutData = await fetchCheckoutshopData(userId, notification.additionalData['metadata.checkout_id'], notification);
      //  await processTransactionData(notification, userId, checkoutData, currencyUpdates);
    } else {
      const checkoutData = await fetchCheckoutData(userId, notification.additionalData['metadata.checkout_id']);
      if (!checkoutData) return;


      const currencyUpdates = updateCurrencyValues(userData, checkoutData);
      await processTransactionData(notification, userId, checkoutData, currencyUpdates);
      await finalizeUserDataUpdate(userId, notification, userData, currencyUpdates, checkoutData);
      await upsertUserPortfolio(userId, notification, userData, checkoutData, currencyUpdates);
      await updatePortfolioDataOnSuccess(userId, notification, checkoutData)
    }
    console.log('Transaction processing completed successfully');
  } catch (error) {
    console.error('Error in transaction saving process:', error);
  }
}
async function fetchUserData(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;

  console.log(`Successfully retrieved user document for ${userDoc.id}`);
  return userDoc.data();
}
function updateCurrencyValues(userData, checkoutData) {
  console.log("value_in_other_currencies11");
  console.log(userData['value_in_other_currencies']);
  // Check if userData and checkoutData are provided and have the expected structure
  if (!userData || !checkoutData || !checkoutData['value_in_different_currencies']) {
    console.error("Invalid userData or checkoutData");
    return; // Exit the function if the necessary objects are not provided or structured correctly
  }

  // Initialize value_in_other_currencies as an empty object if it's not defined
  if (!userData['value_in_other_currencies']) {
    userData['value_in_other_currencies'] = {};
  }

  // Proceed with updating currency values
  let usd_total_spot_price = (userData['value_in_other_currencies']['usd_total_spot_price'] || 0) + (checkoutData['value_in_different_currencies']['usd_purchaseSpot_price'] || 0);
  let usd_total_premium_price = (userData['value_in_other_currencies']['usd_total_premium_price'] || 0) + (checkoutData['value_in_different_currencies']['usd_purchasePremium_price'] || 0);
  let usd_total_final_price = (userData['value_in_other_currencies']['usd_total_final_price'] || 0) + (checkoutData['value_in_different_currencies']['usd_purchaseFinal_price'] || 0);
  let eur_total_spot_price = (userData['value_in_other_currencies']['eur_total_spot_price'] || 0) + (checkoutData['value_in_different_currencies']['eur_purchaseSpot_price'] || 0);
  let eur_total_premium_price = (userData['value_in_other_currencies']['eur_total_premium_price'] || 0) + (checkoutData['value_in_different_currencies']['eur_purchasePremium_price'] || 0);
  let eur_total_final_price = (userData['value_in_other_currencies']['eur_total_final_price'] || 0) + (checkoutData['value_in_different_currencies']['eur_purchaseFinal_price'] || 0);
  let gbp_total_spot_price = (userData['value_in_other_currencies']['gbp_total_spot_price'] || 0) + (checkoutData['value_in_different_currencies']['gbp_purchaseSpot_price'] || 0);
  let gbp_total_premium_price = (userData['value_in_other_currencies']['gbp_total_premium_price'] || 0) + (checkoutData['value_in_different_currencies']['gbp_purchasePremium_price'] || 0);
  let gbp_total_final_price = (userData['value_in_other_currencies']['gbp_total_final_price'] || 0) + (checkoutData['value_in_different_currencies']['gbp_purchaseFinal_price'] || 0);
  // Updating the userData object with the new calculated values
  /* userData['value_in_other_currencies']['usd_total_spot_price'] = usd_total_spot_price;
   userData['value_in_other_currencies']['usd_total_premium_price'] = usd_total_premium_price;
   userData['value_in_other_currencies']['usd_total_final_price'] = usd_total_final_price;
   userData['value_in_other_currencies']['eur_total_spot_price'] = eur_total_spot_price;
   userData['value_in_other_currencies']['eur_total_premium_price'] = eur_total_premium_price;
   userData['value_in_other_currencies']['eur_total_final_price'] = eur_total_final_price;
   userData['value_in_other_currencies']['gbp_total_spot_price'] = gbp_total_spot_price;
   userData['value_in_other_currencies']['gbp_total_premium_price'] = gbp_total_premium_price;
   userData['value_in_other_currencies']['gbp_total_final_price'] = gbp_total_final_price;*/


  console.log("value_in_other_currencies222");

  // Log the updated values
  console.log({
    "usd_total_spot_price": usd_total_spot_price,
    "usd_total_premium_price": usd_total_premium_price,
    "usd_total_final_price": usd_total_final_price,
    "eur_total_spot_price": eur_total_spot_price,
    "eur_total_premium_price": eur_total_premium_price,
    "eur_total_final_price": eur_total_final_price,
    "gbp_total_spot_price": gbp_total_spot_price,
    "gbp_total_premium_price": gbp_total_premium_price,
    "gbp_total_final_price": gbp_total_final_price
  });

  return {
    "usd_total_spot_price": usd_total_spot_price,
    "usd_total_premium_price": usd_total_premium_price,
    "usd_total_final_price": usd_total_final_price,
    "eur_total_spot_price": eur_total_spot_price,
    "eur_total_premium_price": eur_total_premium_price,
    "eur_total_final_price": eur_total_final_price,
    "gbp_total_spot_price": gbp_total_spot_price,
    "gbp_total_premium_price": gbp_total_premium_price,
    "gbp_total_final_price": gbp_total_final_price
  }; // Return the updated userData
}
async function fetchCheckoutData(userId, checkoutId) {
  const checkoutDocRef = db.collection('users').doc(userId).collection('checkout').doc(checkoutId);
  const docSnapshot = await checkoutDocRef.get();

  if (!docSnapshot.exists) return null;

  console.log(`Checkout data for ${checkoutId}: ${JSON.stringify(docSnapshot.data())}`);
  return docSnapshot.data();
}
async function fetchCheckoutshopData(userId, checkoutId, notification) {
  // Reference to the document in shop_cart collection
  const checkoutDocRef = db.collection('users').doc(userId).collection('shop_cart').doc(checkoutId);

  // Get the document snapshot
  const docSnapshot = await checkoutDocRef.get();

  // Check if the document exists
  if (!docSnapshot.exists) {
    console.log(`No data found for checkout ID: ${checkoutId}`);
    return null;
  }

  // Log the fetched data
  const checkoutData = docSnapshot.data();
  console.log(`Checkout data for ${checkoutId}: ${JSON.stringify(checkoutData)}`);

  // Reference to the user document
  const userDocRef = db.collection('users').doc(userId);

  // Reference to the new document in shopTransaction sub-collection
  const transactionDocRef = userDocRef.collection('shoptransaction').doc();

  // Reference to the user_vault collection
  const userVaultCollectionRef = userDocRef.collection('user_vault');

  // Extracting the list of items from checkoutData
  const itemsToAdd = checkoutData.item_list;

  // Check if the "user_vault" collection is empty
  const isFirstDocument = await userVaultCollectionRef.limit(1).get().then(querySnapshot => querySnapshot.empty);

  // If it's the first document, create it with the items
  if (isFirstDocument) {
    await userVaultCollectionRef.add({
      items: itemsToAdd,
      // Add any other fields you need here
    });
  } else {
    // If not the first document, update the first document with the new items
    const firstDocumentSnapshot = await userVaultCollectionRef.limit(1).get();
    const firstDocumentRef = firstDocumentSnapshot.docs[0].ref;

    await firstDocumentRef.update({
      items: firebase.firestore.FieldValue.arrayUnion(...itemsToAdd)
    });
  }

  // Update the payment status in the user document
  await userDocRef.update({
    paymentStatus: true // Replace 'true' with the actual status you wish to set
  })
    .then(() => {
      console.log("Payment status successfully updated!");
    })
    .catch((error) => {
      console.error("Error updating document: ", error);
    });

  // Add the fetched data to the shopTransaction collection
  await transactionDocRef.set({
    ...checkoutData,
    userRef: userDocRef, // Adding a reference to the user document
    extradata: notification
  });
  console.log(`Added checkout data to shopTransaction for checkout ID: ${checkoutId}`);

  // Return the fetched data for further use if needed
  return checkoutData;
}



async function processTransactionData(notification, userId, checkoutData, currencyUpdates) {
  const transactionData = createTransaction1Data(notification, userId, checkoutData);
  await db.collection('transactions').add(transactionData);
  console.log('Transaction data processed and saved');
}
function createTransactionData(notification, userId, checkoutData, currencyUpdates) {
  if (!checkoutData) {
    console.error('checkoutData is undefined');
    // Handle the undefined checkoutData appropriately, maybe return null or an empty object
    return {};
  }
  const additionalData = { ...notification };

  let updates = {};
  switch (notification.amount.currency) {
    case "USD":
      updates[`usd_total_spot_price`] = checkoutData['total_spot_price'];
      updates[`usd_total_premium_price`] = checkoutData['total_premium_cost'];
      updates[`usd_total_final_price`] = notification.amount.value / 100;
      updates[`gbp_total_spot_price`] = 0;
      updates[`gbp_total_premium_price`] = 0;
      updates[`gbp_total_final_price`] = 0;
      updates[`eur_total_spot_price`] = 0;
      updates[`eur_total_premium_price`] = 0;
      updates[`eur_total_final_price`] = 0;
      break;
    case "EUR":
      updates[`eur_total_spot_price`] = checkoutData['total_spot_price'];
      updates[`eur_total_premium_price`] = checkoutData['total_premium_cost'];
      updates[`eur_total_final_price`] = notification.amount.value / 100;
      updates[`gbp_total_spot_price`] = 0;
      updates[`gbp_total_premium_price`] = 0;
      updates[`gbp_total_final_price`] = 0;
      updates[`usd_total_spot_price`] = 0;
      updates[`usd_total_premium_price`] = 0;
      updates[`usd_total_final_price`] = 0;
      break;
    case "GBP":
      updates[`gbp_total_spot_price`] = checkoutData['total_spot_price'];
      updates[`gbp_total_premium_price`] = checkoutData['total_premium_cost'];
      updates[`gbp_total_final_price`] = notification.amount.value / 100;
      updates[`usd_total_spot_price`] = 0;
      updates[`usd_total_premium_price`] = 0;
      updates[`usd_total_final_price`] = 0;
      updates[`eur_total_spot_price`] = 0;
      updates[`eur_total_premium_price`] = 0;
      updates[`eur_total_final_price`] = 0;
      break;
    default:
      console.log('Currency not supported');
  }


  transactionsData = {
    "type": "Purchases",
    "date_time": new Date(notification.eventDate),
    "user_id": userId === undefined ? "" : userId,
    "user_ref_id": db.collection("users").doc(userId),
    "total_amount": notification.amount.value / 100,
    "curreny_type": notification.amount.currency,
    "total_gram": checkoutData['total_gram'],
    "total_premium_cost": checkoutData['total_premium_cost'],
    "total_spot_price": checkoutData['total_spot_price'],
    "gold_price_per_gram": checkoutData['gold_price_per_gram'],
    "gold_spot_price_per_gram": checkoutData['gold_spot_price_per_gram'],
    'status': notification.success,
    "reason": notification.reason,
    "issubscriptions": checkoutData['issubscriptions'],
    "plan_type": checkoutData['plan_type'],
    "value_in_other_currencies": updates,
    "extradata": additionalData,
  };
  return transactionsData;
}
function createTransaction1Data(notification, userId, checkoutData,) {
  if (!checkoutData) {
    console.error('checkoutData is undefined');
    // Handle the undefined checkoutData appropriately, maybe return null or an empty object
    return {};
  }
  const additionalData = { ...notification };




  transactionsData = {
    "type": "Purchases",
    "date_time": new Date(notification.eventDate),
    "user_id": userId === undefined ? "" : userId,
    "user_ref_id": db.collection("users").doc(userId),
    "total_amount": notification.amount.value / 100,
    "curreny_type": notification.amount.currency,
    "total_gram": checkoutData['total_gram'],
    "total_premium_cost": checkoutData['total_premium_cost'],
    "total_spot_price": checkoutData['total_spot_price'],
    "gold_price_per_gram": checkoutData['gold_price_per_gram'],
    "gold_spot_price_per_gram": checkoutData['gold_spot_price_per_gram'],
    'status': notification.success,
    "reason": notification.reason,
    "issubscriptions": checkoutData['issubscriptions'],
    "plan_type": checkoutData['plan_type'],
    "value_in_other_currencies": checkoutData['value_in_different_currencies'],
    "extradata": additionalData,
  };
  return transactionsData;
}
async function finalizeUserDataUpdate(userId, notification, userData, currencyUpdates, checkoutData) {
  console.log('Finalizing user data update');
  console.log(currencyUpdates);

  let gold_Saved = userData.gold_grams_saved;
  let gold_Value = userData.gold_paid_value;
  let amountTransactions = userData.amount_of_transactions == undefined ? 0 : userData.amount_of_transactions;
  if (notification.success == "true" && checkoutData.issubscriptions) {


    let subscriptions = userData.subscriptions || [];
    const existingIndex = subscriptions.findIndex(sub => sub.sip_id === notification.pspReference); // Replace 'some_unique_id' with actual logic

    if (existingIndex !== -1) {
      // Update existing subscription
      subscriptions[existingIndex] = {
        ...subscriptions[existingIndex],
        sip_date: checkoutData.subscriptionsDate,
        plan_type: checkoutData.plan_type,
        plan_active: true,
        sip_purchase_date: new Date(),
        sip_amount: notification.amount.value / 100, // Replace with actual amount
        currency_type: notification.amount.currency, // Replace with actual currency type
        sip_gold_value: checkoutData.total_gram, // Replace with actual gold value
      };
    } else {
      // Add new subscription
      subscriptions.push({
        plan_active: true,
        sip_date: checkoutData.subscriptionsDate,
        plan_type: checkoutData.plan_type,
        sip_purchase_date: new Date(),
        sip_amount: notification.amount.value / 100, // Replace with actual amount
        currency_type: notification.amount.currency, // Replace with actual currency type
        sip_gold_value: checkoutData.total_gram,// Replace with actual gold value
        sip_id: notification.pspReference, // Replace with actual SIP ID
      });
    }

    // Update the user document with the modified subscriptions array

    updateUserData = {
      updated_date: new Date(notification.eventDate),
      user_has_portfolio: true,
      amount_of_transactions: amountTransactions + 1,
      gold_grams_saved: gold_Saved + checkoutData.total_gram,
      gold_paid_value: gold_Value + checkoutData.total_amount,
      paymentStatus: notification.success,
      value_in_other_currencies: currencyUpdates,
      subscriptions: subscriptions
    }

    await db.collection('users').doc(userId).update(updateUserData);
    console.log('User data updated successfully');
  }
  else if (notification.success == "true" && !checkoutData.issubscriptions) {


    updateUserData = {
      updated_date: new Date(notification.eventDate),
      user_has_portfolio: true,
      amount_of_transactions: amountTransactions + 1,
      gold_grams_saved: gold_Saved + checkoutData.total_gram,
      gold_paid_value: gold_Value + checkoutData.total_amount,
      paymentStatus: notification.success,
      value_in_other_currencies: currencyUpdates,

    }
    await db.collection('users').doc(userId).update(updateUserData);
    console.log('User data updated successfully');
  }

  else {
    updateUserData = {
      paymentStatus: notification.success,
      paymentReason: notification.reason,
    }
    await db.collection('users').doc(userId).update(updateUserData);
    console.log('User data updated successfully');
  }

  // console.log('Checkout document deleted successfully');
  // await db.collection('users').doc(userId).collection('checkout').doc(notification.additionalData['metadata.checkout_id']).delete();
  // Additional cleanup if necessary
}
function calculateTotalPortfolioValue(userData, checkoutData) {
  // Assuming total_portfolio_value can be calculated by summing up certain values
  // from userData and checkoutData. Adjust the attributes as per your data model.

  let existingPortfolioValue = userData.total_portfolio_value || 0; // Existing portfolio value from user data
  let additionalValueFromCheckout = checkoutData.total_amount || 0; // Additional value from the current transaction

  // Calculate the new total portfolio value
  let newTotalPortfolioValue = existingPortfolioValue + additionalValueFromCheckout;

  return newTotalPortfolioValue;
}
async function upsertUserPortfolio(userId, notification, userData, checkoutData, currencyUpdates) {
  const portfoliosRef = db.collection('users_portfolios');
  const notificationDate = new Date(notification.eventDate);
  const portfolioUpdates = {
    total_portfolio_value: calculateTotalPortfolioValue(userData, checkoutData), // Implement this function based on your logic
    gold_grams_saved: userData.gold_grams_saved + checkoutData.total_gram
  };
  const transactionData = createTransaction1Data(notification, userId, checkoutData); // Implement this function based on your logic

  // Try to find an existing userPortfolio document for the given userId
  const snapshot = await portfoliosRef.where('user_id', '==', userId).limit(1).get();

  if (!snapshot.empty) {
    // Existing portfolio document found, update it
    await updateExistingUserPortfolio(snapshot.docs[0], portfolioUpdates, transactionData);
  } else {
    // No existing portfolio document found, create a new one
    await createNewUserPortfolio(userId, notificationDate, userData.display_name, portfolioUpdates, transactionData);
  }
}
async function updateExistingUserPortfolio(portfolioDoc, portfolioUpdates, transactionData) {
  const docRef = portfolioDoc.ref;
  const updatedTransactions = [...portfolioDoc.data().transactions, transactionData];

  await docRef.update({
    total_portfolio_value: portfolioUpdates.total_portfolio_value,
    user_total_gram_saved: portfolioUpdates.gold_grams_saved,
    transactions: updatedTransactions
  });

  console.log('Updated existing userPortfolio with new transaction.');
}
async function createNewUserPortfolio(userId, notificationDate, userDisplayName, portfolioUpdates, transactionData) {
  const portfoliosRef = db.collection('users_portfolios');
  const userPortfolio = {
    date_time: notificationDate,
    user_id: userId,
    user_display_name: userDisplayName || "",
    total_portfolio_value: portfolioUpdates.total_portfolio_value,
    user_total_gram_saved: portfolioUpdates.gold_grams_saved,
    transactions: [transactionData]
  };

  await portfoliosRef.add(userPortfolio);
  console.log('Created new userPortfolio with transaction.');
}
async function updatePortfolioDataOnSuccess(userId, notification, checkoutData) {
  // Construct the portfolio data object
  const portfolioData = {
    updated_date: new Date(notification.eventDate),
    user_id: userId,
    estimated_sell_value: checkoutData.total_premium_cost,
    gold_grams_saved: checkoutData.total_gram,
    portfolio_value: checkoutData.total_amount,
  };

  // Add the portfolio data to the database if the notification was successful
  if (notification.success === "true") {
    await db.collection('portfolio_value').add(portfolioData);
    console.log('Portfolio data added successfully for user:', userId);
  }
}


// Additional functions for handling subscriptions, portfolio updates, etc.


/*
async function saveTransaction(notification) {
  const UserID = notification.additionalData.shopperReference;
  console.log("notification transaction " + UserID);

  try {
    const userDoc = await db.collection('users').doc(UserID).get();
    let gold_Saved, gold_Value,
      amountTransactions,
      usd_Total_spot_price,
      usd_Total_premium_price,
      usd_Total_final_price,
      eur_Total_spot_price,
      eur_Total_premium_price,
      eur_Total_final_price,
      gbp_Total_spot_price,
      gbp_Total_premium_price,
      gbp_Total_final_price;
    let userData, userPortfolio;

    if (userDoc.exists) {
      console.log("Successfully retrieved user document.");
      console.log(`${userDoc.id} => ${JSON.stringify(userDoc.data())}`);
      userData = userDoc.data();
      gold_Saved = userData.gold_grams_saved;
      gold_Value = userData.gold_paid_value;
      usd_Total_spot_price = userData.usd_total_spot_price === undefined ? 0 : userData.usd_total_spot_price;
      usd_Total_premium_price = userData.usd_total_premium_price === undefined ? 0 : userData.usd_total_premium_price;
      usd_Total_final_price = userData.usd_total_final_price === undefined ? 0 : userData.usd_total_final_price;
      amountTransactions = userData.amount_of_transactions == undefined ? 0 : userData.amount_of_transactions;
      eur_Total_spot_price = userData.eur_total_spot_price === undefined ? 0 : userData.eur_total_spot_price;
      eur_Total_premium_price = userData.eur_total_premium_price === undefined ? 0 : userData.eur_total_premium_price;
      eur_Total_final_price = userData.eur_total_final_price === undefined ? 0 : userData.eur_total_final_price;
      gbp_Total_spot_price = userData.gbp_total_spot_price === undefined ? 0 : userData.gbp_total_spot_price;
      gbp_Total_premium_price = userData.gbp_total_premium_price === undefined ? 0 : userData.gbp_total_premium_price;
      gbp_Total_final_price = userData.gbp_total_final_price === undefined ? 0 : userData.gbp_total_final_price;

      if (notification.amount.currency == "USD") {
        usd_Total_spot_price = usd_Total_spot_price + gold_Saved;
        usd_Total_premium_price = usd_Total_premium_price + gold_Value;
        usd_Total_final_price = usd_Total_final_price + gold_Value;

      }
      else if (notification.amount.currency == "EUR") {
        eur_Total_spot_price = eur_Total_spot_price + gold_Saved;
        eur_Total_premium_price = eur_Total_premium_price + gold_Value;
        eur_Total_final_price = eur_Total_final_price + gold_Value;



      }
      else {
        gbp_Total_spot_price = gbp_Total_spot_price + gold_Saved;
        gbp_Total_premium_price = gbp_Total_premium_price + gold_Value;
        gbp_Total_final_price = gbp_Total_final_price + gold_Value;



      }
    } else {
      console.log('User document does not exist');
      return;
    }


    const checkoutId = notification.additionalData['metadata.checkout_id'];
    const checkoutDocRef = db.collection('users').doc(UserID).collection('checkout').doc(checkoutId);

    const docSnapshot = await checkoutDocRef.get();

    if (docSnapshot.exists) {
      const doc = docSnapshot.data();
      console.log(`${checkoutId} => ${JSON.stringify(doc)}`);

      const additionalData = { ...notification };
      const total_diff_amount = {
        "usd_total_spot_price": usd_Total_spot_price,
        "usd_total_premium_price": usd_Total_premium_price,
        "usd_total_final_price": usd_Total_final_price,
        "eur_total_spot_price": eur_Total_spot_price,
        "eur_total_premium_price": eur_Total_premium_price,
        "eur_total_final_price": eur_Total_final_price,
        "gbp_total_spot_price": gbp_Total_spot_price,
        "gbp_total_premium_price": gbp_Total_premium_price,
        "gbp_total_final_price": gbp_Total_final_price,
      }

      //   if (notification.amount.value === doc.total_amount && ) {
      console.log('Transaction data saved for the first document');
      transactionsData = {
        "type": "Purchases",
        "date_time": new Date(notification.eventDate),
        "user_id": UserID === undefined ? "" : UserID,
        "total_amount": notification.amount.value / 100,
        "curreny_type": notification.amount.currency,
        "total_gram": doc.total_gram,
        "total_premium_cost": doc.total_premium_cost,
        "total_spot_price": doc.total_spot_price,
        "gold_price_per_gram": doc.gold_price_per_gram,
        "gold_spot_price_per_gram": doc.gold_spot_price_per_gram,
        'status': notification.success,
        "reason": notification.reason,
        "issubscriptions": docSnapshot.data().issubscriptions,
        "plan_type": docSnapshot.data().type,
        "value_in_other_currencies": total_diff_amount,
        "extradata": additionalData,
      };


      await db.collection('transactions').add(transactionsData);


      upsertUserPortfolio(UserID, notification, userData, total_diff_amount, gold_Saved, doc, transactionsData);



      portfolioData = {
        "updated_date": new Date(notification.eventDate),
        "user_id": UserID,
        "estimated_sell_value": doc.total_premium_cost,
        "gold_grams_saved": doc.total_gram,
        "portfolio_value": doc.total_amount,

      };
      if (notification.success == "true") {
        await db.collection('portfolio_value').add(portfolioData);
      }



      if (notification.success == "true" && docSnapshot.exists && docSnapshot.data().issubscriptions) {

        const userData = userDoc.data();
        let subscriptions = userData.subscriptions || [];
        const existingIndex = subscriptions.findIndex(sub => sub.sip_id === notification.pspReference); // Replace 'some_unique_id' with actual logic

        if (existingIndex !== -1) {
          // Update existing subscription
          subscriptions[existingIndex] = {
            ...subscriptions[existingIndex],
            sip_date: new Date(),
            sip_purchase_date: new Date(),
            sip_amount: notification.amount.value / 100, // Replace with actual amount
            currency_type: notification.amount.currency, // Replace with actual currency type
            sip_gold_value: doc.total_gram, // Replace with actual gold value
          };
        } else {
          // Add new subscription
          subscriptions.push({
            sip_date: new Date(),
            sip_purchase_date: new Date(),
            sip_amount: notification.amount.value / 100, // Replace with actual amount
            currency_type: notification.amount.currency, // Replace with actual currency type
            sip_gold_value: doc.total_gram,// Replace with actual gold value
            sip_id: notification.pspReference, // Replace with actual SIP ID
          });
        }

        // Update the user document with the modified subscriptions array
        await db.collection('users').doc(UserID).update({ subscriptions: subscriptions });

        updateUserData = {
          updated_date: new Date(notification.eventDate),
          user_has_portfolio: true,
          amount_of_transactions: amountTransactions + 1,
          gold_grams_saved: gold_Saved + doc.total_gram,
          gold_paid_value: gold_Value + doc.total_amount,
          paymentStatus: notification.success,

          value_in_other_currencies: total_diff_amount
        }
      } else if (notification.success == "true" && docSnapshot.exists && !docSnapshot.data().issubscriptions) {


        updateUserData = {
          updated_date: new Date(notification.eventDate),
          user_has_portfolio: true,
          amount_of_transactions: amountTransactions + 1,
          gold_grams_saved: gold_Saved + doc.total_gram,
          gold_paid_value: gold_Value + doc.total_amount,
          paymentStatus: notification.success,
          value_in_other_currencies: total_diff_amount,

        }
      }

      else {
        updateUserData = {
          paymentStatus: notification.success,
          paymentReason: notification.reason,
        }
      }
      await db.collection('users').doc(UserID).update(updateUserData);
      console.log('User data updated successfully');
      console.log('Checkout document deleted successfully');

      await db.collection('users').doc(UserID).collection('checkout').doc(checkoutId).delete();


      //  }
    }
  } catch (error) {
    console.error('Error in transaction saving process:', error);
  }
}

// Replace 'yourUserIdHere' with the actual user ID
async function upsertUserPortfolio(UserID, notification, userData, total_diff_amount, gold_Saved, doc, transactionsData) {
  // Reference to the users_portfolios collection
  const portfoliosRef = db.collection('users_portfolios');
  // Try to find an existing userPortfolio document with the given UserID
  const snapshot = await portfoliosRef.where('user_id', '==', UserID).limit(1).get();

  if (!snapshot.empty) {
    // Document exists, so update the existing document
    const docRef = snapshot.docs[0].ref;
    const existingData = snapshot.docs[0].data();

    // Add the transactionsData object to the existing transactions array
    const updatedTransactions = [...existingData['transactions'], transactionsData]; // No spread operator for transactionsData

    await docRef.update({
      total_portfolio_value: total_diff_amount,
      user_total_gram_saved: gold_Saved + doc.total_gram,
      transactions: updatedTransactions // Update the transactions array with the new object added
    });

    console.log('Updated existing userPortfolio with new transactions.');
  } else {
    // Document does not exist, so create a new userPortfolio document
    const userPortfolio = {
      "date_time": new Date(notification.eventDate),
      "user_id": UserID || "",
      "user_display_name": userData.display_name || "",
      "total_portfolio_value": total_diff_amount,
      "user_total_gram_saved": gold_Saved + doc.total_gram,
      "transactions": [transactionsData] // Include the transactionsData object as the initial element in the array
    };

    // Add the new userPortfolio to the collection
    await portfoliosRef.add(userPortfolio);

    console.log('Created new userPortfolio with transactions.');
  }
}


*/



function getPort() {
  return process.env.PORT || 8080;
}


app.listen(getPort(), () => console.log(`Server started -> http://localhost:${getPort()}`));







