const clientKey = document.getElementById("clientKey").innerHTML;
const type = document.getElementById("type").innerHTML;
const amount = document.getElementById("amount").innerHTML;
const userid = document.getElementById("userid").innerHTML;
const currency = document.getElementById("currency").innerHTML;
const checkoutid = document.getElementById("checkoutid").innerHTML;
const language = document.getElementById("language").innerHTML;
const paymenttype = document.getElementById("paymentType").innerHTML;
// Used to finalize a checkout call in case of redirect
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
async function startTokenization() {
//showLoader();

    try {
        const response = await callServer("/api/tokenization/sessions",{"key1":userid,"key2":amount,"currency":currency,"checkout_id":checkoutid,"paymentType":paymenttype});
        console.log(response);

        const checkout = await createAdyenCheckout(response,paymentAmount, currency,userid,language);
        checkout.create(type).mount(document.getElementById(type));
       //  hideLoader();
    } catch (error) {
        // hideLoader();
        console.error(error);
        alert("Error occurred. Look at console for details.");
    }
}

// Some payment methods use redirects. This is where we finalize the operation
async function finalizeTokenization() {
  try {
    const checkout = await createAdyenCheckout({id: sessionId});
    checkout.submitDetails({details: {redirectResult}});
  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details.");
  }
}

async function createAdyenCheckout(session, amountValue, currencyCode,userID,language){
    return new AdyenCheckout(
    {
      clientKey,
      locale: language,
      environment: "test",
      session: session,
      showPayButton: true,
      storePaymentMethod: true,
      paymentMethodsConfiguration: {
        card: {
          hasHolderName: true,
          holderNameRequired: true,
          name: "Credit or debit card",
          amount: {
            value:amountValue ,
            currency: currencyCode,
          },
        }
      },
      onPaymentCompleted: (result, component) => {
        console.info("onPaymentCompleted");
        console.info(result, component);


       handleServerResponse(result, component,userID);
      },
      onError: (error, component) => {
        console.error("onError");
        console.error(error.name, error.message, error.stack, component);
       handleServerResponse(error, component,userID);
      },
    }
  );
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

function handleServerResponse(res, _component,userID) {
    switch (res.resultCode) {
        case "Authorised":

            window.location.href = "/result/success,"+userID;
            break;
        case "Pending":
        case "Received":
            window.location.href = "/result/pending,"+userID;
            break;
        case "Refused":
            window.location.href = "/result/failed,"+userID;
            break;
        default:
            window.location.href = "/result/error,"+userID;
            break;
    }
}

if (!sessionId) { startTokenization() } else { finalizeTokenization(); }