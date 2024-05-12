const clientKey = document.getElementById("clientKey").innerHTML;
const type = document.getElementById("type").innerHTML;
const amount = document.getElementById("amount").innerHTML;
const userid = document.getElementById("userid").innerHTML;
const currency = document.getElementById("currency").innerHTML;
const checkoutid = document.getElementById("checkoutid").innerHTML;
const paymenttype = document.getElementById("paymentType").innerHTML;

const language = document.getElementById("language").innerHTML;
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId'); // Unique identifier for the payment session
const redirectResult = urlParams.get('redirectResult');
const paymentAmount = parseInt(amount)*100;
function showLoader() {
  document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}
async function startCheckout() {
  showLoader(); 
  try {
  console.log("amount",amount);
    const checkoutSessionResponse = await callServer("/api/sessions?type=" + type,{"key1":userid,"key2":amount,"currency":currency,"checkout_id":checkoutid,"paymentType":paymenttype});
    const checkout = await createAdyenCheckout(checkoutSessionResponse, paymentAmount, currency,userid,language);
    checkout.create(type).mount(document.getElementById(type));
    hideLoader(); 
  } catch (error) {
    console.error(error);
    
    alert("Error occurred. Look at console for details");
    hideLoader(); 
  }
}
// Some payment methods use redirects. This is where we finalize the operation
async function finalizeCheckout() {
    try {
        // Create AdyenCheckout re-using existing Session
        const checkout = await createAdyenCheckout({id: sessionId});

        // Submit the extracted redirectResult (to trigger onPaymentCompleted() handler)
        checkout.submitDetails({details: {redirectResult}});
    } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
    }
}
async function createAdyenCheckout(session, amountValue, currencyCode,userID,language)  {
console.log("=======Session",session);
const configuration = {
    clientKey,
    locale: language,  // You might also consider changing this to "sv_SE" for Swedish language settings
    environment: "test",  // change to live for production
    showPayButton: true,
    session: session,
    shopperReference : userID,
  storePaymentMethod : true,
  shopperInteraction : "Ecommerce",
  recurringProcessingModel : "Subscription",
    paymentMethodsConfiguration: {
        ideal: {
            showImage: true
        },
        card: {
            hasHolderName: true,
            holderNameRequired: true,
            name: "Credit or debit card",
            amount: {
                value: amountValue,
                currency: currencyCode
            },
            enableThreeDSecure: true  // This enables 3D Secure for card payments
        },
       /* paypal: {
            amount: {
                value: amountValue,
                currency: currencyCode
            },
            environment: "test",
            countryCode: "SE"   // Set to Sweden's country code
        }*/




/*const configuration = {
        clientKey,
        locale: "en_US",
        environment: "test",  // change to live for production
        showPayButton: true,
        session: session,
        paymentMethodsConfiguration: {
            ideal: {
                showImage: true
            },
            card: {
                hasHolderName: true,
                holderNameRequired: true,
                name: "Credit or debit card",
                amount: {
                   value: amountValue,
                   currency: currencyCode
                }
            },
            paypal: {
                amount: {
                  value: amountValue,
                  currency: currencyCode
                },
                environment: "test",
                countryCode: "US"   // Only needed for test. This will be automatically retrieved when you are in production.
            }*/
            
        },
        onPaymentCompleted: (result, component) => {
          console.log("Configuration:=========>", configuration);
          console.log("RESULT=====================>",JSON.stringify(result));



        handleServerResponse(result, component,userID);
        // Push data to Firebase database
          
          
        },
        onError: (error, component) => {
            console.error(error.name, error.message, error.stack, component);
             handleServerResponse(result, component,userID);
        }
    };
    console.log("Configuration:", configuration);
    return new AdyenCheckout(configuration);
}
// Calls your server endpoints
async function callServer(url, data) {
  const res = await fetch(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : "",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await res.json();
}
// Handles responses sent from your server to the client
function handleServerResponse(res, component,userID) {
  if (res.action) {
    component.handleAction(res.action);
  } else {

    switch (res.resultCode) {
      case "Authorised":


      window.location.href = "/result/success,"+userID ;



        
        break;
      case "Pending":
      case "Received":
        window.location.href = "/result/pending,"+userID ;
        break;
      case "Refused":
        window.location.href = "/result/failed,"+userID ;
        break;
      default:
        window.location.href = "/result/error,"+userID ;
        break;
    }
  }
}
if (!sessionId) {
    startCheckout();
}
else {
    // existing session: complete Checkout
    finalizeCheckout();
}
