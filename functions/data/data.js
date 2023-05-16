// https://jackwhiting.co.uk/posts/using-firebase-admin-sdk-with-netlify-lambda-functions/
const express = require("express");
const serverless = require("serverless-http");

// OpenAI

//https://platform.openai.com/docs/api-reference/authentication
const {
  Configuration,
  OpenAIApi
} = require("openai");
const configuration = new Configuration({
  organization: "org-B2zBs88YN5R4AmRGLf3puoDt",
  apiKey: process.env.VUE_APP_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Firestore

const {
  Firestore,
  FieldValue
} = require('@google-cloud/firestore');

const serviceAccount = {
  "type": "service_account",
  "project_id": "claus-survey",
  "private_key_id": process.env.VUE_APP_STORE_PRIVATE_ID,
  "private_key": process.env.VUE_APP_STORE_PRIVATE_KEY.replace(/\\n/gm, "\n"),
  "client_email": "admin-103@claus-survey.iam.gserviceaccount.com",
  "client_id": "116626161904597486252",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/admin-103%40claus-survey.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Create a new client with the service account
const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount
});

// Express App
const app = express();
const router = express.Router();

router.get("/", (req, res) => {
  res.sendStatus(404);
});

router.post("/send_openai_request", async function (req, res) {
  var INPUT = JSON.parse(req.body);
  var prompt = 'Question: ' + INPUT.title + ', Description: ' + INPUT.description + '\n\n####\n\n';
  const response = await openai.createCompletion({
    model: "curie:ft-marketing-customer-insight-university-of-hamburg-2023-04-16-10-26-28",
    prompt: prompt,
    max_tokens: 80
  });
  let answer = response.data.choices[0].text;
  const lastDotIndex = answer.lastIndexOf(".") != -1 ? answer.lastIndexOf(".") + 1 : answer.length;
  return res.status(200).json({
    success: true,
    text: answer.substring(0, lastDotIndex),
  });
});

router.get("/get_open_scenario", async function (req, res) {
  try {
    const collectionRef = firestore.collection('scenarios');
    const querySnapshot = await collectionRef.where('completed', '<', process.env.VUE_APP_MAX_REQUESTS_SCENARIO).get();

    const documents = [];
    querySnapshot.forEach((documentSnapshot) => {
      const data = documentSnapshot.data();
      documents.push({
        id: documentSnapshot.id,
        data
      });
    })
    let id;
    if (await documents.length == 0) {
      id = Math.floor(Math.random() * 3);
    }
    else {
      id = Math.floor(Math.random() * documents.length);
    }
    
    res.send({
      scenario_id: id
    });
  } catch (error) {
    console.log(error);
  }
})

router.post("/send_answer", async function (req, res) {
  var INPUT = JSON.parse(req.body);

  try {
    const collectionRef = firestore.collection('responses');
    const documentRef = collectionRef.doc()

    await documentRef.set({
      respondent_id: INPUT.respondent_id,
      scenario_id: INPUT.scenario_id,
      question_title: INPUT.question_title,
      question_description: INPUT.question_description,
      openai_answer: INPUT.openai_answer
    });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
  }
})

router.post('/set_counter', async (req, res) => {
  var INPUT = JSON.parse(req.body);

  const collectionScenariosRef = firestore.collection('scenarios');
    const querySnapshot = await collectionScenariosRef.where('id', '==', INPUT.scenario_id).get();

    querySnapshot.forEach(async (documentSnapshot) => {
      const documentRef = collectionScenariosRef.doc(documentSnapshot.id);
      await documentRef.update({
        'completed': FieldValue.increment(1)
      });
    });
    console.log('set counter' + INPUT.scenario_id)
    res.sendStatus(200);
});

app.use("/.netlify/functions/data", router);

module.exports.handler = serverless(app);
