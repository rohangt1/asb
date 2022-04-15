const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
//const fs = require('fs');
const path = require('path');

const admin = require('firebase-admin');
const express = require('express');
const app = express();
const cors=require('cors');
app.use(cors());
const saltedMd5 = require('salted-md5');
app.set('views', path.join(__dirname, 'static', 'views'));
app.use('/public', express.static(path.join(__dirname, 'static', 'public')));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const multer = require('multer');
const upload = multer();
var nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const REFRESH_TOKEN = "1//04bbM6JCFu8hRCgYIARAAGAQSNwF-L9IrSsFZUWdFsLyBu0RwjdbYMGsXn0aGR6THU1AgckIt7QKjxUFjy0VN_cIYGcB_9-RYbv8";
const CLIENT_SECRET = "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";
const CLIENT_ID = "909703194558-ss01pbjoreqkskn6su7f03op8ch6oqs8.apps.googleusercontent.com";
const Ftp = require('ftp');
const ftp = require("basic-ftp")
var fs = require('fs');
app.use(express.urlencoded({extended: true}));
const AUTH_TOKEN = 'dasdalkd9w0aid09wjf9okdpfoj0sjd289unklvxcnjbrb9tg94nv';
//*************************************
const schedule = require('node-schedule');
const startTime = new Date(Date.now() + 1000);
const endTime1 = new Date(Date.now() + 10000);
var counter = 0;
var todayDate = new Date();
var dd = String(todayDate.getDate()).padStart(2, '0');
var mm = String(todayDate.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = todayDate.getFullYear();
todayDate = dd + '-' + mm + '-' + yyyy;
//const job = schedule.scheduleJob({ start: startTime, end: endTime, rule: '*/10 * * * * *' }, async function(){
const job = schedule.scheduleJob({ start: startTime, rule: '* * * /1 * *' }, async function(){
//const job = schedule.scheduleJob({ start: startTime, rule: '*/5 * * * * *' }, async function(){
  counter++;
  console.log('Monitoring all client data, ', counter);

  var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }

    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    var keysClientData = [];
    await userRef.once('value').then((snapshot) => {
        var index = 0;
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            keysClientData.push({id: Object.keys(snapshot.val())[index], clientname: itemVal['Client Name'], email: itemVal.email, date: itemVal.initial_certification_conclusion_date, surveillance_date: surveillance_audit_date});
            index++;
        });
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    }); 
    for (var intIdx = 0; intIdx < keysClientData.length; intIdx++) {
        var newUserRef=db.ref("surveillance_audit_clients/" + keysClientData[intIdx].id + "/surveillance_audit_date");
        var surveillance_audit_date = "";
        var initial_certification_conclusion_date = "";
        await newUserRef.once('value').then((snapshot) => {
            var item1 = snapshot.val();
            if (item1 != null)
            surveillance_audit_date = item1;
        });
        if (surveillance_audit_date == "") {
            var auditDate = keysClientData[intIdx].date;
            var today = new Date(todayDate.split('-')[2],todayDate.split('-')[1]-1,todayDate.split('-')[0]);
            var date2 = new Date(auditDate.split('-')[2],auditDate.split('-')[1]-1,auditDate.split('-')[0]);
            var timeDiff = Math.abs(date2.getTime() - today.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            if (diffDays > 183) {
                //console.log('Name: ', keysClientData[intIdx].clientname, 'diffdays: ', diffDays);
                const createTransporter = async () => {
                    const oauth2Client = new OAuth2(
                        CLIENT_ID,
                        CLIENT_SECRET,
                        "https://developers.google.com/oauthplayground"
                    );
                    oauth2Client.setCredentials({
                        refresh_token: REFRESH_TOKEN
                    });
                    const accessToken = await new Promise((resolve, reject) => {
                        oauth2Client.getAccessToken((err, token) => {
                        if (err) {
                            res.send(err);
                        }
                        resolve(token);
                        });
                    });
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                        type: "OAuth2",
                        user: "cwactechnologies@gmail.com",
                        accessToken,
                        clientId: CLIENT_ID,
                        clientSecret: CLIENT_SECRET,
                        refreshToken: REFRESH_TOKEN
                        }
                    });
                    return transporter;
                    };
                    const sendEmail = async (emailOptions) => {
                        let emailTransporter = await createTransporter();
                        await emailTransporter.sendMail(emailOptions, function(error, info) {               
                            if(error) {
                                console.log(error);
                            } else {
                                console.log('Thank you for your submission. We will contact you soon.')
                            }
                        });
                    };
                    sendEmail({
                        subject: "Please conduct your surveillance Audit",
                        //text: "Dear sir,\nYou applied for Initial Certification " + diffDays + " days back. Please apply for initial certification within " + (365 - diffDays) + " days.",
                        text: "Dear sir,\nYou have completed your Initial Certification Process on " + keysClientData[intIdx].date + ". Please apply for initial certification within " + (365 - diffDays) + " days.",
                        to: keysClientData[intIdx].email,
                        from: "cwactechnologies@gmail.com"
                    });
            }
        }
        var newItem = keysClientData[intIdx];
        newItem.surveillance_date = surveillance_audit_date;
        keysClientData[intIdx] = newItem;
    }
});
//*************************************
app.post('/addclientapplicationform', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    addUser({
        'Client Name': req.body['Client Name'],
        'Approved': 'No',
        'description': req.body['description'],
        'date': req.body['date'],
        'assignedToWhom': req.body['assignedToWhom'],
        'stage1_team_assigned': 'No',
        'stage2_team_assigned': 'No',
        'stage1_plan_status': 'Open',
        'stage1_plan_date': "",
        'stage2_plan_status': 'Open',
        'stage2_plan_date': "",
        'quotation_status': 'Open',
        'quotation_date': '',
        'HO_activity_status': 'Open',
        'HO_activity_date': '',
        'stage1_plan_task_status': 'Open',
        'stage1_plan_task_date': '',
        'stage2_plan_task_status': 'Open',
        'stage2_plan_task_date': '',
        'initial_certification_conclusion': 'Open',
        'initial_certification_conclusion_date': '',
        'surveillance_audit_status': 'Open',
        'email': req.body['email'],
        'phone': req.body['phone'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Customer Application Added Successfully');
            client.delete();
        })
    }
});
app.post('/addclientapplicationform_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'status': 'Open',
        'date': req.body['date'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Customer Application Added Successfully');
            client.delete();
        })
    }
});
app.post('/addclientapplicationfile', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('Customer Application Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/addclientapplicationfile_to_logs', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('Customer Application Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/fetchcustomerapplication_v1', (req, res) => {
    // if (req.body['audit_software_token'] != AUTH_TOKEN) {
    //     res.send({'error_message': "User Not Authorized"});
    //     return;
    // }
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    userRef.on('value', (snapshot) => {
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            if (req.body.request_from == 'Quotation Status' || req.body.request_from == 'HO Activity')
            {
                if (itemVal['Approved'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Assign Stage 1 Audit Team')
            {
                if (itemVal['quotation_status'] == 'Completed')
                //if (itemVal['Approved'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Stage 1 Audit Plan') {
                if (itemVal['stage1_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Assign Stage 2 Audit Team') {
                if (itemVal['stage1_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Stage 2 Audit Plan') {
                if (itemVal['stage2_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Initial Certification Conclusions') {
                if (itemVal['stage2_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Existing Surveillance Audit Clients') {
                if (itemVal['initial_certification_conclusion'] == 'Completed')
                    keys.push(itemVal);
            }
            else keys.push(itemVal);
            index++;
            if (index == snapshot.numChildren()) {
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetchcustomerapplication_v2', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    userRef.on('value', (snapshot) => {
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            if (req.body.request_from == 'Assign Surveillance Audit Team')
            {
                if (itemVal['Status'] == 'Approved')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Surveillance Audit Plan')
            {
                if (itemVal['surveillance_audit_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Surveillance Audit Conclusions')
            {
                if (itemVal['surveillance_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Existing Recertification Audit Clients')
            {
                if (itemVal['surveillance_audit_conclusion'] == 'Completed')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Assign Recertification Audit Team')
            {
                if (itemVal['recertification_status'] == 'Approved')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Plan')
            {
                if (itemVal['recertification_audit_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Conclusions')
            {
                if (itemVal['recertification_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            else keys.push(itemVal);
            index++;
            if (index == snapshot.numChildren()) {
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetchcustomerapplication_v3', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    userRef.on('value', (snapshot) => {
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            // if (req.body.request_from == 'Assign Surveillance Audit Team')
            // {
            //     if (itemVal['Status'] == 'Approved')
            //         keys.push(itemVal);
            // }
            // else if (req.body.request_from == 'Surveillance Audit Plan')
            // {
            //     if (itemVal['surveillance_audit_team_assigned'] == 'Yes')
            //         keys.push(itemVal);
            // }
            // else if (req.body.request_from == 'Surveillance Audit Conclusions')
            // {
            //     if (itemVal['surveillance_plan_status'] == 'Completed')
            //         keys.push(itemVal);
            // }
            // else if (req.body.request_from == 'Existing Recertification Audit Clients')
            // {
            //     if (itemVal['surveillance_audit_conclusion'] == 'Completed')
            //         keys.push(itemVal);
            // }
            //else if (req.body.request_from == 'Assign Recertification Audit Team')
            if (req.body.request_from == 'Assign Recertification Audit Team')
            {
                if (itemVal['Status'] == 'Approved')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Plan')
            //if (req.body.request_from == 'Recertification Audit Plan')
            {
                if (itemVal['recertification_audit_team_assigned'] == 'Yes')
                    keys.push(itemVal);
            }
            else if (req.body.request_from == 'Recertification Audit Conclusions')
            {
                if (itemVal['recertification_plan_status'] == 'Completed')
                    keys.push(itemVal);
            }
            // else keys.push(itemVal);
            else keys.push(itemVal);
            index++;
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetchcustomerapplication', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage1_audit_team_members', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage1_audit_team_members', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage1_audit_teams/" + req.body['clientid'] + "/stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage1_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage1_audit_teams/" + req.body['clientid'] + "/stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_surveillance_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_surveillance_audit_teams/" + req.body['clientid'] + "/surveillance_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_recertification_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_recertification_audit_teams/" + req.body['clientid'] + "/recertification_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage2_audit_team_members_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage2_audit_teams/" + req.body['clientid'] + "/stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = {'Member Name': item.val()};
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage1_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, stage1PlanDescription: value.stage1PlanDescription, status: value.status, date: value.date});
                });
            }
            res.send({stage1PlanDescription: val.stage1PlanDescription, logs: keys});
        }
        else res.send({stage1PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit_plan', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //if (snapshot.val() != null)
        //    res.send(snapshot.val());
        //else res.send({surveillanceAuditPlanDescription: "", taskList: []});
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({surveillancePlanDescription: val.surveillanceAuditPlanDescription, logs: keys});
        }
        else res.send({stage2PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit_plan', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //console.log(snapshot.val());
        // if (snapshot.val() != null)
        //     res.send(snapshot.val());
        // else res.send({recertificationAuditPlanDescription: "", taskList: []});
        // client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({recertificationPlanDescription: val.recertificationAuditPlanDescription, logs: keys});
        }
        else res.send({stage2PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage1_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage2_task_list', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/taskList");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //res.send(snapshot.val());
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_stage1_audit_plan_v1', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/stage1PlanDescription");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
// app.post('/fetch_stage2_audit_plan', (req, res) => {
//     //console.log(req.body['clientid'] );
//     var serviceAccount = require('./admin.json');
//     var client;
//     if (!admin.apps.length) {
//         client = admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount),
//             databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
//             authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
//         });
//     }else {
//         client = admin.app(); // if already initialized, use that one
//         client.delete();
//         client = admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount),
//             databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
//             authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
//         });
//     }
//     var db=admin.database();
//     var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/stage2PlanDescription");
//     userRef.on('value', (snapshot) => {
//         res.send(JSON.stringify(snapshot.val()));
//         client.delete();
//       }, (errorObject) => {
//         console.log('The read failed: ' + errorObject.name);
//       }); 
// });
app.post('/fetch_stage2_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, stage2PlanDescription: value.stage2PlanDescription, status: value.status, date: value.date});
                });
            }
            res.send({stage2PlanDescription: val.stage2PlanDescription, logs: keys});
        }
        else res.send({stage2PlanDescription: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_HOActivity', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        //console.log(snapshot.val() );
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.HOActivityDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_initial_certification_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.conclusionDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit_conclusion', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        //console.log(req.body['clientid']);
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            //console.log({description: val.conclusionDescription, logs: keys});
            res.send({description: val.conclusionDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit_conclusion', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.conclusionDescription, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_surveillance_audit', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            //console.log({description: val.description, logs: keys});
            res.send({description: val.description, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_recertification_audit', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/recertification_description");
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        //client.delete();
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.description, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_quotations', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations/" + req.body['clientid']);
    userRef.on('value', (snapshot) => {
        if (snapshot.val() != null) {
            var val = snapshot.val();
            var keys = [];
            if (val.logs) {
                Object.entries(val.logs).forEach(([key, value]) => {
                    keys.push({id: key, description: value.description, status: value.status, date: value.date});
                });
            }
            res.send({description: val.quotation_description, logs: keys});
        }
        else res.send({description: "", logs: []});
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetch_assigned_stage2_audit_team_members', (req, res) => {
    //console.log(req.body['clientid'] );
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage2_audit_teams/" + req.body['clientid'] + "/stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      });
});
app.get('/fetch_stage2_audit_team_members', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/fetchcustomerapplicationfiles', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    if (list[intIdx].name != 'logs')
                        fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage1_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    if (list[intIdx].name != 'attendance_sheet' && 
                        list[intIdx].name != 'audit_report' && 
                        list[intIdx].name != 'auditor_appointment_form' && 
                        list[intIdx].name != 'confidentiality_statement' && 
                        list[intIdx].name != 'document_review_report' && 
                        list[intIdx].name != 'nc_report' && 
                        list[intIdx].name != 'logs' && 
                        list[intIdx].name != 'surveillance_audit_report')
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage1_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_initial_certification_log_files', (req, res) => {
    const ftpClient = new Ftp();
    //console.log(req.body.clientid);
    //console.log(req.body.timestamp);
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage2_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_plan_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_quotation_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_ho_activity_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_initial_certification_conclusion_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_conclusion_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_conclusion_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_log_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body.clientid + "/logs/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    // if (list[intIdx].name != 'attendance_sheet' && 
                    //     list[intIdx].name != 'audit_report' && 
                    //     list[intIdx].name != 'auditor_appointment_form' && 
                    //     list[intIdx].name != 'confidentiality_statement' && 
                    //     list[intIdx].name != 'document_review_report' && 
                    //     list[intIdx].name != 'nc_report' && 
                    //     list[intIdx].name != 'surveillance_audit_report')
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_stage1_audit_plan_form_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    var allFileNames = [];
    await ftpClient.on( 'ready', async function() {
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/auditor_appointment_form", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'auditor_appointment_form': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/confidentiality_statement", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'confidentiality_statement': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/document_review_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'document_review_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/attendance_sheet", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'attendance_sheet': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/surveillance_audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'surveillance_audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body.timestamp + "/nc_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'nc_report': fileNames})
            //console.log(allFileNames);
            res.send(allFileNames);
            ftpClient.end();
        });
    });
});
app.post('/fetch_stage2_audit_plan_form_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    var allFileNames = [];
    await ftpClient.on( 'ready', async function() {
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/auditor_appointment_form", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'auditor_appointment_form': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/confidentiality_statement", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'confidentiality_statement': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/document_review_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'document_review_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/attendance_sheet", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'attendance_sheet': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/surveillance_audit_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'surveillance_audit_report': fileNames})
        });
        await ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp + "/nc_report", false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            allFileNames.push({'nc_report': fileNames})
            //console.log(allFileNames);
            res.send(allFileNames);
            ftpClient.end();
        });
    });
});
app.post('/fetch_stage2_audit_plan_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    if (list[intIdx].name != 'attendance_sheet' && 
                        list[intIdx].name != 'audit_report' && 
                        list[intIdx].name != 'auditor_appointment_form' && 
                        list[intIdx].name != 'confidentiality_statement' && 
                        list[intIdx].name != 'document_review_report' && 
                        list[intIdx].name != 'nc_report' && 
                        list[intIdx].name != 'logs' && 
                        list[intIdx].name != 'surveillance_audit_report')
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_HOActivity_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    var fileNames = [];
    var fileNamesContractReviewForm = [];
    var fileNamesAuditDocumentChecklist = [];
    var fileNamesCertificationRecommendationReport = [];
    await ftpClient.on( 'ready', async function() {
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    if (list[intIdx].name != 'audit_document_checklist' && 
                        list[intIdx].name != 'certification_recommendation_report' && 
                        list[intIdx].name != 'contract_review_form')
                    fileNames.push(list[intIdx].name);
                }
            }
            //res.send(fileNames);
            //ftpClient.end();
        });
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp + "/contract_review_form", false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                    fileNamesContractReviewForm.push(list[intIdx].name);
            }
            //res.send(fileNames);
            //ftpClient.end();
        });
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp + "/audit_document_checklist", false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                    fileNamesAuditDocumentChecklist.push(list[intIdx].name);
            }
            //res.send(fileNames);
            //ftpClient.end();
        });
        await ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body.timestamp + "/certification_recommendation_report", false, function( err, list ) {
            if ( err ) throw err;
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                    fileNamesCertificationRecommendationReport.push(list[intIdx].name);
            }
            //res.send(fileNames);
            res.send({
                fileNames: fileNames,
                fileNamesContractReviewForm: fileNamesContractReviewForm,
                fileNamesAuditDocumentChecklist: fileNamesAuditDocumentChecklist,
                fileNamesCertificationRecommendationReport: fileNamesCertificationRecommendationReport,
            });
            ftpClient.end();
        });
    });
});
app.post('/fetch_quotation_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_initial_certification_conclusion_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_surveillance_audit_conclusion_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/fetch_recertification_audit_conclusion_files', (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body.timestamp, false, function( err, list ) {
            if ( err ) throw err;
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..' && list[intIdx].name !== 'logs')
                {
                    fileNames.push(list[intIdx].name);
                }
            }
            res.send(fileNames);
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/approve_client_init_cert', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/Approved");
                userRefApproved.set(req.body['Approved']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_surveillance_audit_status', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/Status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_recertification_audit_status', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/Status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_surveillance_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("surveillance_audit_clients");
    var userRefApproved=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/surveillance_audit_conclusion");
    userRefApproved.set(req.body['status'], (err) => {
        //client.delete();
        if (err) {
            res.send(err);
        }
        else {
            if (req.body['status'] == 'Completed') {
                var userRefSurveillanceAudit = db.ref("recertification_audit_clients");
                addUser({
                    'Client Name': req.body['clientName'],
                    'Status': 'Not Conducted',
                    'recertification_status': 'Not Conducted',
                    'description': '',
                    'recertification_audit_date': '',
                    'recertification_description': '',
                    //'surveillance_audit_team_assigned': 'No',
                    'recertification_audit_team_assigned': 'No',
                    //'surveillance_plan_status': 'Open',
                    'recertification_plan_status': 'Open',
                    //'surveillance_plan_task_status': 'Open',
                    'recertification_plan_task_status': 'Open',
                    //'surveillance_audit_conclusion': 'Open',
                    'recertification_audit_conclusion': 'Open',
                    'recertification_audit_plan_date': '',
                    'recertification_audit_conclusion_date': ''
                })
                async function addUser(obj1) {
                    //console.log('reached here');
                    var oneUser=userRefSurveillanceAudit.child(req.body['clientid']);
                    await oneUser.update(obj1,(err)=>{
                        client.delete();
                        if(err){
                            res.send('Something went wrong. Please submit again.');
                        }
                        else res.send('Operation Completed Successfully');
                        //else res.send('Customer Application Added Successfully');
                        //else res.send('Operation Completed Successfully');
                        //client.delete();
                        //res.send('Operation Completed Successfully');
                    })
                }
            }
            else {
                //console.log("surveillance_audit_clients/" + timestamp);
                var userRefSurveillanceAudit = db.ref("recertification_audit_clients/" + req.body['clientid']);
                //userRefSurveillanceAudit.remove();
                userRefSurveillanceAudit.remove((err) => {
                    client.delete();
                    if (err) {
                        console.log(err);
                        res.send(err)
                    }
                    else res.send('Operation Completed Successfully');
                })
            }
        }
        //res.send('Operation Completed Successfully');
    });
    //ApproveDisapprove();
    // function ApproveDisapprove() {
    // userRef.on('value', (snapshot) => {
    //     var stringrecord = JSON.stringify(snapshot);
    //     recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
    //     for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
    //     {
    //         var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
    //         if (timestamp === req.body.clientid) {
    //             var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/surveillance_audit_conclusion");
    //             userRefApproved.set(req.body['status']);
    //             client.delete();
    //             break;
    //         }
    //     }
        
    // }, (errorObject) => {

    // }); 
    
    // }
});
app.post('/mark_recertification_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/recertification_audit_conclusion");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        else res.send('Operation Completed Successfully');
    })
    //var userRef=db.ref("recertification_audit_clients");
    // ApproveDisapprove();
    // function ApproveDisapprove() {
    // userRef.on('value', (snapshot) => {
    //     var stringrecord = JSON.stringify(snapshot);
    //     recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
    //     for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
    //     {
    //         var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
    //         if (timestamp === req.body.timestamp) {
    //             var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/recertification_audit_conclusion");
    //             userRefApproved.set(req.body['status']);
    //             client.delete();
    //             break;
    //         }
    //     }
        
    //     }, (errorObject) => {

    //     }); 
    //     res.send('Operation Completed Successfully');
    // }
});
app.post('/mark_stage1_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage1_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage1_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_initial_certification_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_stage2_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_recertification_audit_plan_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_quotation_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_ho_activity_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_initial_certification_conclusion_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_conclusion_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_recertification_audit_conclusion_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_recertification_audit_log', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/status");
    userRef.set(req.body['status'], (err) => {
        client.delete();
        if (err) {
            res.send(err);
        }
        res.send('Operation Completed Successfully');
    });
});
app.post('/mark_surveillance_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/surveillance_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_recertification_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/recertification_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage1_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage1_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_surveillance_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("surveillance_audit_clients/" + timestamp + "/surveillance_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_recertification_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("recertification_audit_clients/" + timestamp + "/recertification_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage2_plan_task', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage2_plan_task_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_stage2_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/stage2_plan_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_quotation', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/quotation_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_HOActivity', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    function ApproveDisapprove() {
    userRef.on('value', (snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/HO_activity_status");
                userRefApproved.set(req.body['status']);
                client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    res.send('Operation Completed Successfully');
}
});
app.post('/mark_initial_certification_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    ApproveDisapprove();
    async function ApproveDisapprove() {
    //userRef.on('value', (snapshot) => {
    await userRef.once('value').then((snapshot) => {
        var stringrecord = JSON.stringify(snapshot);
        recordsets = stringrecord.substring(1, stringrecord.length - 2).split("},");
        for (var intIdx = recordsets.length - 1; intIdx >= 0; intIdx--)
        {
            var timestamp = recordsets[intIdx].substring(0, recordsets[intIdx].indexOf('":')).replace('{"', "").replace('"', '');
            if (timestamp === req.body.timestamp) {
                var userRefApproved=db.ref("client_application_form_data/" + timestamp + "/initial_certification_conclusion");
                userRefApproved.set(req.body['status']);
                if (req.body['status'] == 'Completed') {
                    var userRefSurveillanceAudit = db.ref("surveillance_audit_clients");
                    addUser({
                        'Client Name': req.body['clientName'],
                        'Status': 'Not Conducted',
                        //'recertification_status': 'Not Conducted',
                        'description': '',
                        'surveillance_audit_date': '',
                        //'recertification_description': '',
                        'surveillance_audit_team_assigned': 'No',
                        //'recertification_audit_team_assigned': 'No',
                        'surveillance_plan_status': 'Open',
                        //'recertification_plan_status': 'Open',
                        'surveillance_plan_task_status': 'Open',
                        //'recertification_plan_task_status': 'Open',
                        'surveillance_audit_conclusion': 'Open',
                        //'recertification_conclusion': 'Open',
                        'surveillance_audit_plan_date': '',
                        'surveillance_audit_conclusion_date': ''
                    })
                    async function addUser(obj1) {
                        //console.log('reached here');
                        var oneUser=userRefSurveillanceAudit.child(timestamp);
                        await oneUser.update(obj1,(err)=>{
                            client.delete();
                            if(err){
                                res.send('Something went wrong. Please submit again.');
                            }
                            else res.send('Operation Completed Successfully');
                            //else res.send('Customer Application Added Successfully');
                            //else res.send('Operation Completed Successfully');
                            client.delete();
                            //res.send('Operation Completed Successfully');
                        })
                    }
                }
                else {
                    //console.log("surveillance_audit_clients/" + timestamp);
                    var userRefSurveillanceAudit = db.ref("surveillance_audit_clients/" + timestamp);
                    //userRefSurveillanceAudit.remove();
                    userRefSurveillanceAudit.remove((err) => {
                        client.delete();
                        if (err) {
                            console.log(err);
                            res.send(err)
                        }
                        else res.send('Operation Completed Successfully');
                    })
                }
                //client.delete();
                break;
            }
        }
        
    }, (errorObject) => {

    }); 
    }
    //res.send('Operation Completed Successfully');
});
app.post('/add_stage1_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage1_audit_teams");
    addUser({
        'stage1_audit_teams': req.body['list_stage1_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_team_assigned");
                userRef.set("Yes");
                res.send('Stage 1 Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_surveillance_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_surveillance_audit_teams");
    addUser({
        'surveillance_audit_teams': req.body['list_surveillance_audit_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_team_assigned");
                userRef.set("Yes");
                res.send('Surveillance Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_recertification_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_recertification_audit_teams");
    addUser({
        'recertification_audit_teams': req.body['list_recertification_audit_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_team_assigned");
                userRef.set("Yes");
                res.send('Recertification Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_stage2_audit_team', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("assigned_stage2_audit_teams");
    addUser({
        'stage2_audit_teams': req.body['list_stage2_teams'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body.clientid);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_team_assigned");
                userRef.set("Yes");
                res.send('Stage 2 Audit Team Assigned Successfully');
                client.delete();
            }
        })
    }
});
app.post('/add_stage1_audit_team_in_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    addUser({
        'Member Name': req.body['Member Name'],
        'Member Email': req.body['Member Email'],
        'Member PhoneNumber': req.body['Member PhoneNumber'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Stage 1 Audit Team Added Successfully');
            client.delete();
        })
    }
});
app.post('/add_employee_in_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("employees");
    addUser({
        'Member Name': req.body['Member Name'],
        'Member Designation': req.body['Member Designation'],
        'Member Email': req.body['Member Email'],
        'Member PhoneNumber': req.body['Member PhoneNumber'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Employee Added Successfully');
            client.delete();
        })
    }
});
app.post('/add_stage2_audit_team_in_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    addUser({
        'Member Name': req.body['Member Name'],
        'Member Email': req.body['Member Email'],
        'Member PhoneNumber': req.body['Member PhoneNumber'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('Stage 2 Audit Team Added Successfully');
            client.delete();
        })
    }
});
app.post('/downloadcustomerapplicationfile', async (req, res) => {
    
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        //ftpClient.downloadTo(req.body.filename, "/init_certification_client_application/" + req.body.timestamp + "/" + req.body.filename)
        ftpClient.get("/init_certification_client_application/" + req.body.timestamp + "/" + req.body.filename, function(err, stream) {
            if (err) throw err;
            var ext = req.body.extensions.replace("\\n", '');
            ext = req.body.filename.slice(0, -1);
            stream.once('close', function() { ftpClient.end(); });
            stream.pipe(fs.createWriteStream(ext));
            console.log("Completed!!!");
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
   
});
app.get('/connect_mssql', (req, res) => {
    const sql = require('mssql')
    const sqlConfig = {
    user: "sa",
    password: "12345",
    database: "DATABASE1",
    server: 'DESKTOP-L64S3HU\\TEW_SQLEXPRESS',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
    }
    try {
        sql.connect(sqlConfig)
            .then(function () {
                // Function to retrieve all the data - Start
                console.log("connected");
                new sql.Request()
                    .query("select * from TABLE1")
                    .then(function (dbData) {
                        if (dbData == null || dbData.length === 0)
                            return;
                        //console.dir('All the courses');
                        console.log(dbData);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

            }).catch(function (error) {
                console.dir(error);
            });
    } catch (error) {
        console.dir(error);
    }
})
app.get('/connect_mysql', (req, res) => {
    var mysql = require("mysql");
    const pool  = mysql.createPool({
        connectionLimit : 1000,
        connectTimeout  : 60 * 60 * 1000,
        acquireTimeout  : 60 * 60 * 1000,
        timeout         : 60 * 60 * 1000,
        host            : 'localhost',
        user            : 'root',
        password        : '',
        database        : 'cwacin',
        port: 3307
    })
    pool.getConnection((err, connection) => {
        if(err) {
            res.send('Error connecting to Db');
            return;
        }
        res.send("Connection established")
        // connection.query('SELECT * from beers', (err, rows) => {
        //     connection.release() // return the connection to pool

        //     if (!err) {
        //         res.send(rows)
        //     } else {
        //         console.log(err)
        //     }

        //     // if(err) throw err
        //     console.log('The data from beer table are: \n', rows)
        // })
    })
})
app.get('/fetch_stage1_audit_team_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage1_audit_team_library_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
//app.get('/fetch_employee_library', (req, res) => {
app.post('/fetch_employee_library', (req, res) => {
    //console.log('reached here');
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("employees");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            //console.log(index);
            if (req.body['request_from'] === 'Surveillance Audit Team') {
                if (itemVal['Member Designation'] == "Surveillance Auditor") {
                    keys.push(itemVal);
                }
            }
            else if (req.body['request_from'] === 'Recertification Audit Team') {
                if (itemVal['Member Designation'] == "Recertification Auditor") {
                    keys.push(itemVal);
                }
            }
            else keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage2_audit_team_library', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        res.send(JSON.stringify(snapshot.val()));
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.get('/fetch_stage2_audit_team_library_v1', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_teams");
    userRef.on('value', (snapshot) => {
        //res.send(JSON.stringify(snapshot.val()));
        var keys = [];
        var index = 0;
        if (snapshot.numChildren() == 0) {
            res.send(keys);
        }
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            itemVal.selected = false;
            itemVal.index = index;
            index++;
            keys.push(itemVal);
            if (index == snapshot.numChildren()) {
                //console.log(keys);
                res.send(keys);
            }
        });
        client.delete();
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
});
app.post('/add_stage1_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans");
    addUser({
        'stage1PlanDescription': req.body['stage1PlanDescription'],
        // 'date': req.body['date']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Stage 1 Audit Plan Added Successfully');
                });
            }
            //client.delete();
        })
    }
});
app.post('/add_stage1_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'stage1PlanDescription': req.body['stage1PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Stage 1 Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_stage2_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'stage2PlanDescription': req.body['stage2PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Stage 2 Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_surveillance_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['stage2PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Surveillance Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_recertification_audit_plan_to_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['stage2PlanDescription'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Recertification Audit Plan Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_quotation_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Quotation Added Successfully');
            }
        })
    }
});
app.post('/add_ho_activity_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Head Office Activity Added Successfully');
            }
        })
    }
});
app.post('/add_initial_certification_conclusion_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Initial Certification Conclusion Added Successfully');
            }
        })
    }
});
app.post('/add_surveillance_audit_conclusion_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Surveillance Audit Conclusion Added Successfully');
            }
        })
    }
});
app.post('/add_recertification_audit_conclusion_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                res.send('Recertification Audit Conclusion Added Successfully');
            }
        })
    }
});
app.post('/add_surveillance_audit_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Surveillance Audit Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_recertification_audit_logs', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/logs");
    addUser({
        'description': req.body['description'],
        'date': req.body['date'],
        'status': 'Open'
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            client.delete();
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                //db=admin.database();
                //userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_status");
                //userRef.set("In-Progress");
                res.send('Recertification Audit Added Successfully');
                //client.delete();
            }
        })
    }
});
app.post('/add_surveillance_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans");
    addUser({
        'surveillanceAuditPlanDescription': req.body['stage1PlanDescription'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Surveillance Audit Plan Added Successfully');
                });
                //res.send('Surveillance Audit Plan Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_recertification_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans");
    addUser({
        'recertificationAuditPlanDescription': req.body['stage1PlanDescription'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Recertification Audit Plan Added Successfully');
                });
                //res.send('Recertification Audit Plan Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_stage1_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage1_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage1_plan_task_status");
                userRef.set("In-Progress");
                res.send('Stage 1 Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_surveillance_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_plan_task_status");
                userRef.set("In-Progress");
                res.send('Surveillance Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_recertification_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_plan_task_status");
                userRef.set("In-Progress");
                res.send('Recertification Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_stage2_audit_plan_task_list', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans");
    //console.log("req.body['clientid']: ", req.body['clientid']);
    addUser({
        'taskList': req.body['taskList'],
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_plan_task_status");
                userRef.set("In-Progress");
                res.send('Stage 2 Audit Plan Task Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/delete_stage1_audit_plan_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_stage1_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/stage1_audit_plan/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_customer_application_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_stage2_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_plan_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_quotation_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/quotations/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_ho_activity_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_initial_certification_conclusion_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_conclusion_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_conclusion_log_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body['clientid'] + "/logs/" + req.body['timestamp'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_initial_certification_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/init_certification_client_application/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/init_certification_client_application/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_surveillance_audit_plan_files', async (req, res) => {
    //console.log(req.body['clientid']);
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_plans/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    //console.log('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/" + list[intIdx].name);
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_recertification_audit_plan_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_plans/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_stage2_audit_plan_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        //console.log(req.body['clientid']);
        ftpClient.list("domains/cwac.in/public_html/stage2_audit_plan/" + req.body['clientid'], false, async function( err, list ) {
            //console.log('here');
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            //console.log(list);
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            //console.log('success');
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.post('/delete_HOActivity_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
        });
    });
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/contract_review_form", false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/contract_review_form/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
        });
    });
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/audit_document_checklist", false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/audit_document_checklist/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
        });
    });
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/HOActivity_files/" + req.body['clientid'] + "/certification_recommendation_report", false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/certification_recommendation_report/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_initial_certification_conclusion_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/initial_certification_conclusion_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_surveillance_audit_conclusion_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_conclusion_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_recertification_audit_conclusion_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_conclusion_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_surveillance_audit_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_recertification_audit_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/recertification_audit_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/delete_surveillance_audit_files', async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect({
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.list("domains/cwac.in/public_html/surveillance_audit_files/" + req.body['clientid'], false, async function( err, list ) {
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            res.send("Success");
            ftpClient.end();
        });
    });
});
app.post('/add_stage1_audit_plan_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 1 Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_stage1_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage1_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 1 Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_stage2_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage2_audit_plan/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 2 Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_plan_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_plans/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_quotation_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/quotation_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/quotation_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Quotation Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_ho_activity_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Head Office Activity Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_initial_certification_conclusion_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Initial Certification Conclusion Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_conclusion_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Conclusion Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_conclusion_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Conclusion Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_log_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_files/' + req.body['clientid'] + "/logs/" + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_surveillance_audit_plan_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_plans/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Surveillance Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_recertification_audit_plan_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_plans/' + req.body['timestamp'], true, (err) => {
            if (!err) {
            ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_plans/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Recertification Audit Plan Added Successfully'); 
            });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_stage1_audit_plan_form_files', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    //console.log(req.body['directory_name']);
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'], true, async (err) => {
            if (!err) {
            await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage1_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 1 Audit Plan Form Added Successfully'); 
            });  
            }
        });
    });

})
app.post('/add_stage2_audit_plan_form_files', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    //console.log(req.body['directory_name']);
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'], true, async (err) => {
            if (!err) {
            await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'] + "/" + req.body['directory_name'] + "/" + req.file.originalname, function( err, list ) {
                if ( err ) throw err;
                ftpClient.end();     
                res.send('Stage 2 Audit Plan Form Added Successfully'); 
            });  
            }
        });
    });

})
app.post('/add_stage2_audit_plan', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("stage2_audit_plans");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'stage2PlanDescription': req.body['stage2PlanDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_plan_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/stage2_plan_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Stage 2 Audit Plan Added Successfully');
                });
                //res.send('Stage 2 Audit Plan Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_HOActivity', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("ho_activities");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'HOActivityDescription': req.body['HOActivityDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/HO_activity_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/HO_activity_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('HO Activity Added Successfully');
                });
                // res.send('HO Activity Added Successfully');
                // client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_initial_certification_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("initial_certification_conclusion");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'conclusionDescription': req.body['conclusionDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/initial_certification_conclusion");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/initial_certification_conclusion_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Initial Certification Conclusion Added Successfully');
                });
                //res.send('Initial Certification Conclusion Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_surveillance_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_conclusion");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'conclusionDescription': req.body['conclusionDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_conclusion");
                userRef.set("In-Progress");
                userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/surveillance_audit_conclusion_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Surveillance Audit Conclusion Added Successfully');
                });
                //res.send('Surveillance Audit Conclusion Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_recertification_audit_conclusion', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("recertification_audit_conclusion");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'conclusionDescription': req.body['conclusionDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_conclusion");
                userRef.set("In-Progress");
                userRef=db.ref("recertification_audit_clients/" + req.body.clientid  + "/recertification_audit_conclusion_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Recertification Audit Conclusion Added Successfully');
                });
                //res.send('Recertification Audit Conclusion Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_surveillance_audit', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/description");
    userRef.set(req.body['conclusionDescription'], (err) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            var userRefInner=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/Status");
            userRefInner.set("Not Approved", (err) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    // res.send('Surveillance Audit Details Added Successfully');
                    // client.delete();
                    var userRefIInner=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/surveillance_audit_date");
                    userRefIInner.set(req.body['date'], (err) => {
                        if (err) {
                            console.log(err);
                            res.send(err);
                        }
                        else {
                            res.send('Surveillance Audit Details Added Successfully');
                            client.delete();
                        }
                    });
                }
            });
        }
    });

    // userRef.update(req.body['conclusionDescription'],(err)=>{
    //     if(err){
    //         res.send('Something went wrong. Please submit again.');
    //     }
    //     else {
    //         //res.send('Customer Application Added Successfully');
    //         db=admin.database();
    //         userRef=db.ref("surveillance_audit_clients/" + req.body.clientid  + "/Status");
    //         userRef.set("In-Progress");
    //         res.send('Surveillance Audit Details Added Successfully');
    //         client.delete();
    //     }
    //     client.delete();
    // })
    //console.log(req.body['stage2PlanDescription']);
    // addUser({
    //     'conclusionDescription': req.body['conclusionDescription']
    // })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/initial_certification_conclusion");
                userRef.set("In-Progress");
                res.send('Initial Certification Conclusion Added Successfully');
                client.delete();
            }
            client.delete();
        })
    }
});
app.post('/add_recertification_audit', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    //var userRef=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/recertification_description");
    var userRef=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/description");
    userRef.set(req.body['conclusionDescription'], (err) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            //var userRefInner=db.ref("surveillance_audit_clients/" + req.body['clientid'] + "/recertification_status");
            var userRefInner=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/Status");
            userRefInner.set("Not Approved", (err) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    //res.send('Recertification Audit Details Added Successfully');
                    //client.delete();
                    var userRefIInner=db.ref("recertification_audit_clients/" + req.body['clientid'] + "/recertification_audit_date");
                    userRefIInner.set(req.body['date'], (err) => {
                        if (err) {
                            console.log(err);
                            res.send(err);
                        }
                        else {
                            res.send('Recertification Audit Details Added Successfully');
                            client.delete();
                        }
                    });
                }
            });
        }
    });
});
app.post('/add_quotation', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("quotations");
    //console.log(req.body['stage2PlanDescription']);
    addUser({
        'quotation_description': req.body['QuotationDescription']
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['clientid']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else {
                //res.send('Customer Application Added Successfully');
                db=admin.database();
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/quotation_status");
                userRef.set("In-Progress");
                userRef=db.ref("client_application_form_data/" + req.body.clientid  + "/quotation_date");
                userRef.set(req.body['date'], (err) => {
                    client.delete();
                    res.send('Quotation Added Successfully');
                });
                //res.send('Quotation Added Successfully');
                //client.delete();
            }
            //client.delete();
        })
    }
});
app.post('/add_stage2_audit_plan_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/stage2_audit_plan/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    //ftpClient.end();     
                    res.send('Stage 2 Audit Plan Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/add_HOActivity_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });

})
app.post('/add_initial_certification_conclusion_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/initial_certification_conclusion_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Initial Certification Conclusion Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_surveillance_audit_conclusion_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_conclusion_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Surveillance Audit Conclusion Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_recertification_audit_conclusion_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_conclusion_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Recertification Audit Conclusion Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_surveillance_audit_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/surveillance_audit_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/surveillance_audit_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Surveillance Audit Details Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_recertification_audit_file', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/recertification_audit_files/' + req.body['timestamp'], true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/recertification_audit_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();   
                    res.send('Recertification Audit Details Added Successfully'); 
                });  
            }
            else console.log(err);
        });
    });
})
app.post('/add_HOActivity_file_contract_review_form', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    });
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/contract_review_form", true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/contract_review_form/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });
})
app.post('/add_HOActivity_file_audit_document_checklist', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    });
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/audit_document_checklist", true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/audit_document_checklist/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });
})
app.post('/add_HOActivity_file_certification_recommendation_report', upload.single('file'), async (req, res) => {
    const ftpClient = new Ftp();
    await ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    });
    await ftpClient.on( 'ready', async function() {
        await ftpClient.mkdir('domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/certification_recommendation_report", true, async (err) => {
            if (!err) {
                await ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/HOActivity_files/' + req.body['timestamp'] + "/certification_recommendation_report/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('HO Activity Added Successfully'); 
                });  
            }
        });
    });
})
app.post('/add_quotation_file', upload.single('file'), (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', function() {
        ftpClient.mkdir('domains/cwac.in/public_html/quotation_files/' + req.body['timestamp'], true, (err) => {
            if (!err) {
                ftpClient.put( req.file.buffer, 'domains/cwac.in/public_html/quotation_files/' + req.body['timestamp'] + "/" + req.file.originalname, function( err, list ) {
                    if ( err ) throw err;
                    ftpClient.end();     
                    res.send('Quotation Added Successfully'); 
                });  
            }
        });
    });
    
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
})
app.post('/delete_quotation_files', async (req, res) => {
    const ftpClient = new Ftp();
    ftpClient.on( 'ready', async function() {
        //console.log(req.body['clientid']);
        ftpClient.list("domains/cwac.in/public_html/quotation_files/" + req.body['clientid'], false, async function( err, list ) {
            //console.log('here');
            if ( err ) 
            {
                console.log(err);
                throw err;
            }
            //console.log(list);
            var fileNames = [];
            for (var intIdx = 0; intIdx < list.length; intIdx++)
            {
                if (list[intIdx].name !== '.' && list[intIdx].name !== '..')
                {
                    await ftpClient.delete('domains/cwac.in/public_html/quotation_files/' + req.body['clientid'] + "/" + list[intIdx].name, () => {
                        if (err) {
                            res.send(err);
                            ftpClient.end();
                            console.log('error');
                            return;
                        }
                    });
                }
            }
            //console.log('success');
            res.send("Success");
            ftpClient.end();
        });
    });
    ftpClient.connect( {
        'host': 'ftp.cwac.in',
        'user': 'cwacin',
        'password': '$Rv01111996'
    } );
});
app.get('/generate_mis_reports_ref', (req, res) => {
    var xl = require('excel4node');
    var wb = new xl.Workbook();
   
    // Add Worksheets to the workbook
    var ws = wb.addWorksheet('Sheet 1');
    var ws2 = wb.addWorksheet('Sheet 2');
   
    // Create a reusable style
    var style = wb.createStyle({
      font: {
        color: '#FF0800',
        size: 12,
      },
      numberFormat: '$#,##0.00; ($#,##0.00); -',
    });
   
   // Set value of cell A1 to 100 as a number type styled with 
   ws.cell(1, 1)
      .number(100)
      .style(style);
   
   // Set value of cell B1 to 200 as a number type styled with 
  
  //paramaters of style
  ws.cell(1, 2)
    .number(200)
    .style(style);
   
  // Set value of cell C1 to a formula styled with paramaters of style
  ws.cell(1, 3)
    .formula('A1 + B1')
    .style(style);
   
  // Set value of cell A2 to 'string' styled with paramaters of style
  ws.cell(2, 1)
    .string('Rohan Vishwakarma')
    .style(style);
   
  // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
  ws.cell(3, 1)
    .bool(true)
    .style(style)
    .style({font: {size: 14}});
  //console.log('reached here');
  wb.write('Excel.xlsx', res);
});
app.get('/generate_mis_reports', async (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    } else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    var keys = [];
    var intAppointedAuditorIdx = 2;
    var intTaskRegisterIdx = 2;
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    await userRef.once('value').then(async (snapshot) => {
        if (snapshot.numChildren() == 0) {
            //res.send(keys);
        }
        var index = 0;
        snapshot.forEach(function(item) {
            var itemVal = item.val();
            itemVal.timestamp = Object.keys(snapshot.val())[index];
            index++;
            keys.push(itemVal);
        });
        //console.log('completed');
        var ws = wb.addWorksheet('Ongoing Projects with Status');
        var ws2 = wb.addWorksheet('Client wise Appointed Auditors');
        var ws3 = wb.addWorksheet('Task Register');
        var style = wb.createStyle({
          font: {
            color: '#FF0800',
            size: 12,
          },
          numberFormat: '$#,##0.00; ($#,##0.00); -',
        });
        ws.cell(1, 1).string('Client Name');
        ws.cell(1, 2).string('Application Approved?');
        ws.cell(1, 3).string('Quotation Status?');
        ws.cell(1, 4).string('Stage 1 Team Assigned?');
        ws.cell(1, 5).string('Stage 1 Plan Status');
        ws.cell(1, 6).string('Stage 1 Task Status');
        ws.cell(1, 7).string('Stage 2 Team Assigned?');
        ws.cell(1, 8).string('Stage 2 Plan Status');
        ws.cell(1, 9).string('Stage 2 Task Status');
        ws.cell(1, 10).string('HO Activity Status');
        ws2.cell(1, 1).string("Client Name");
        ws2.cell(1, 2).string("Audit Type");
        ws2.cell(1, 3).string("Member Name");
        ws2.cell(1, 4).string("Member Email");
        ws2.cell(1, 5).string("Member Phone Number");
        ws3.cell(1, 1).string("Client Name");
        ws3.cell(1, 2).string("Audit Type");
        ws3.cell(1, 3).string("Member Name");
        ws3.cell(1, 4).string("Task Name");
        ws3.cell(1, 5).string("Task Description");
        for (var intIdx = 0; intIdx < keys.length; intIdx++) {
            ws.cell(intIdx + 2, 1).string(keys[intIdx]['Client Name']);
            ws.cell(intIdx + 2, 2).string(keys[intIdx].Approved);
            ws.cell(intIdx + 2, 3).string(keys[intIdx].quotation_status);
            ws.cell(intIdx + 2, 4).string(keys[intIdx].stage1_team_assigned);
            ws.cell(intIdx + 2, 5).string(keys[intIdx].stage1_plan_status);
            ws.cell(intIdx + 2, 6).string(keys[intIdx].stage1_plan_task_status);
            ws.cell(intIdx + 2, 7).string(keys[intIdx].stage2_team_assigned);
            ws.cell(intIdx + 2, 8).string(keys[intIdx].stage2_plan_status);
            ws.cell(intIdx + 2, 9).string(keys[intIdx].stage2_plan_task_status);
            ws.cell(intIdx + 2, 10).string(keys[intIdx].HO_activity_status); 
            // Stage 1 Audit Printing
            //ws2.cell(intAppointedAuditorIdx, 1).string("Stage 1 Audit");
            var refStage1AssignedTeams=db.ref("assigned_stage1_audit_teams/" + keys[intIdx].timestamp + "/stage1_audit_teams/");
            await refStage1AssignedTeams.once('value').then(async (snapshot) => {
                var keysStage1AssignedTeams = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysStage1AssignedTeams.push(itemVal);
                });
                if (keysStage1AssignedTeams.length != 0)  {
                    ws2.cell(intAppointedAuditorIdx, 1).string(keys[intIdx]['Client Name']);
                    //ws3.cell(intTaskRegisterIdx, 1).string(keys[intIdx]['Client Name']);
                    ws2.cell(intAppointedAuditorIdx, 2).string('Stage 1 audit');
                    //ws3.cell(intTaskRegisterIdx, 2).string('Stage 1 audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysStage1AssignedTeams.length; intInnerIdx++) 
                {
                    var ref=db.ref("stage1_audit_teams");
                    var email = "";
                    var phoneNo = "";
                    await ref.once('value').then(async function(dataSnapshot) {
                        dataSnapshot.forEach(function(item) {
                            var itemVar = item.val();
                            if (itemVar['Member Name'] == keysStage1AssignedTeams[intInnerIdx]) {
                                email = itemVar['Member Email'];
                                phoneNo = itemVar['Member PhoneNumber'];
                                return;
                            }
                        })
                    });
                    ws2.cell(intAppointedAuditorIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    //ws3.cell(intTaskRegisterIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    ws2.cell(intAppointedAuditorIdx, 4).string(email);
                    ws2.cell(intAppointedAuditorIdx, 5).string(phoneNo);
                    intAppointedAuditorIdx++;
                    //intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            var refStage1TaskList=db.ref("stage1_audit_plans/" + keys[intIdx].timestamp + "/taskList/");
            await refStage1TaskList.once('value').then(async (snapshot) => {
                var keysTaskList = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysTaskList.push(itemVal);
                });
                if (keysTaskList.length != 0)  {
                    ws3.cell(intTaskRegisterIdx, 1).string(keys[intIdx]['Client Name']);
                    ws3.cell(intTaskRegisterIdx, 2).string('Stage 1 audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysTaskList.length; intInnerIdx++) {
                    ws3.cell(intTaskRegisterIdx, 3).string(keysTaskList[intInnerIdx]['Member Assigned']);
                    ws3.cell(intTaskRegisterIdx, 4).string(keysTaskList[intInnerIdx]['Task Name']);
                    ws3.cell(intTaskRegisterIdx, 5).string(keysTaskList[intInnerIdx]['Task Description']);
                    intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            // End of Stage 1 Audit Printing
            // Stage 2 Audit Printing
            //ws2.cell(intAppointedAuditorIdx, 1).string("Stage 2 Audit");
            var refStage1AssignedTeams=db.ref("assigned_stage2_audit_teams/" + keys[intIdx].timestamp + "/stage2_audit_teams/");
            await refStage1AssignedTeams.once('value').then(async (snapshot) => {
                var keysStage1AssignedTeams = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysStage1AssignedTeams.push(itemVal);
                });
                if (keysStage1AssignedTeams.length != 0)  {
                    ws2.cell(intAppointedAuditorIdx, 2).string('Stage 2 Audit');
                    //ws3.cell(intTaskRegisterIdx, 2).string('Stage 2 Audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysStage1AssignedTeams.length; intInnerIdx++) 
                {    
                    var ref=db.ref("stage2_audit_teams");
                    var email = "";
                    var phoneNo = "";
                    await ref.once('value').then(async function(dataSnapshot) {
                        dataSnapshot.forEach(function(item) {
                            var itemVar = item.val();
                            if (itemVar['Member Name'] == keysStage1AssignedTeams[intInnerIdx]) {
                                email = itemVar['Member Email'];
                                phoneNo = itemVar['Member PhoneNumber'];
                                return;
                            }
                        })
                    });
                    ws2.cell(intAppointedAuditorIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    //ws3.cell(intTaskRegisterIdx, 3).string(keysStage1AssignedTeams[intInnerIdx]);
                    ws2.cell(intAppointedAuditorIdx, 4).string(email);
                    ws2.cell(intAppointedAuditorIdx, 5).string(phoneNo);
                    intAppointedAuditorIdx++;
                    //intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            refStage1TaskList=db.ref("stage2_audit_plans/" + keys[intIdx].timestamp + "/taskList/");
            await refStage1TaskList.once('value').then(async (snapshot) => {
                var keysTaskList = [];
                await snapshot.forEach(function(item) {
                    var itemVal = item.val();
                    keysTaskList.push(itemVal);
                });
                if (keysTaskList.length != 0)  {
                    //ws3.cell(intTaskRegisterIdx, 1).string(keys[intIdx]['Client Name']);
                    ws3.cell(intTaskRegisterIdx, 2).string('Stage 2 audit');
                }
                for (var intInnerIdx = 0; intInnerIdx < keysTaskList.length; intInnerIdx++) {
                    ws3.cell(intTaskRegisterIdx, 3).string(keysTaskList[intInnerIdx]['Member Assigned']);
                    ws3.cell(intTaskRegisterIdx, 4).string(keysTaskList[intInnerIdx]['Task Name']);
                    ws3.cell(intTaskRegisterIdx, 5).string(keysTaskList[intInnerIdx]['Task Description']);
                    intTaskRegisterIdx++;
                }
              }, (errorObject) => {
                console.log('The read failed: ' + errorObject.name);
            });
            // End of Stage 2 Audit Printing
        }
      }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
      }); 
      wb.write('Excel.xlsx', res);
      client.delete();
});
app.get('/sample_on_async', async (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("client_application_form_data");
    //var done = false;
    await getData1();
    async function getData1() {
        await userRef.once('value')
        .then(async function(dataSnapshot) {
            console.log('completed inside stage 1')
        });
    }
    //while (!done);
    console.log('completed stage 1')


    userRef=db.ref("stage1_audit_teams");
    await getData2();
    async function getData2() {
        await userRef.once('value')
            .then(async function(dataSnapshot) {
                console.log('completed inside stage 2')
        });
    }   
    console.log('completed stage 2')


    res.send('done');
});
app.post('/register_user', (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("registered_users");
    addUser({
        'timestamp': req.body.timestamp,
        'username': req.body.username,
        'password': req.body.password,
        'email': req.body.email
    })
    function addUser(obj) {
        var oneUser=userRef.child(req.body['timestamp']);
        oneUser.update(obj,(err)=>{
            if(err){
                res.send('Something went wrong. Please submit again.');
            }
            else res.send('User Registered Successfully');
            client.delete();
        })
    }
});
app.post('/logging_in', async (req, res) => {
    var serviceAccount = require('./admin.json');
    var client;
    if (!admin.apps.length) {
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }else {
        client = admin.app(); // if already initialized, use that one
        client.delete();
        client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://auditsoftware-53237-default-rtdb.firebaseio.com/",
            authDomain: "auditsoftware-53237-default-rtdb.firebaseapp.com",
        });
    }
    var db=admin.database();
    var userRef=db.ref("registered_users");
    var status = "Invalid username or password";
    await userRef.once('value').then((snapshot) => {
        snapshot.forEach(function(item) {
            var user = item.val();
            if (user.username == req.body.username && user.password == req.body.password) {
                //status = "Logged in Successfully";
                status = AUTH_TOKEN;
                return;
            }
        });
        res.send(status);
    }, (errorObject) => {

    }); 
});
app.post('/verify_token', async (req, res) => {
    if (req.body['audit_software_token'] == AUTH_TOKEN) 
        res.send("Token Verified");
    else res.send("Token Invalid");
});
// added on 5-Apr-2022
app.get('/testurl_1', (req, res) => {
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Ongoing Projects with Status');
    ws.cell(1, 1).string('Entry 1');
    ws.cell(2, 1).string('Entry 2');
    ws.cell(3, 1).string('Entry 3');
    wb.write('Excel.xlsx', res);
    
});
app.post('/testurl_2', (req, res) => {
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Ongoing Projects with Status');
    ws.cell(1, 1).string(req.body['entry1']);
    ws.cell(2, 1).string(req.body['entry2']);
    ws.cell(3, 1).string(req.body['entry3']);
    var bf = null;
    wb.writeToBuffer().then(function(buffer) {
        // Do something with buffer
        console.log('buffer')
        bf = buffer
        const ftpClient = new Ftp();
        ftpClient.on( 'ready', function() {
            ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                if (!err) {
                    ftpClient.put( buffer, 'domains/cwac.in/public_html/temp_files/Excel.xlsx', function( err, list ) {
                        if ( err ) throw err;
                        ftpClient.end();     
                        res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                        //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                    });  
                }
            });
        });
        
        ftpClient.connect( {
            'host': 'ftp.cwac.in',
            'user': 'cwacin',
            'password': '$Rv01111996'
        } );
    });
});
app.post('/testurl_3', (req, res) => {
    var Excel = require('exceljs');
    var workbook = new Excel.Workbook();
    //workbook.xlsx.readFile('old.xlsx')
    workbook.xlsx.readFile('dummy_template.xlsx')
        .then(async function() {
            var worksheet = workbook.getWorksheet(1);
            var row = worksheet.getRow(1);
            row.getCell(10).value = req.body['entry1']; // A5's value set to 5
            row.getCell(11).value = req.body['entry2']; // A5's value set to 5
            row.getCell(12).value = req.body['entry3']; // A5's value set to 5
            row.commit();
            //return workbook.xlsx.writeFile('new.xlsx');
            //const buffer = await workbook.xlsx.writeBuffer();
            const buffer = await workbook.xlsx.writeBuffer();
            const ftpClient = new Ftp();
            ftpClient.on( 'ready', function() {
                //ftpClient.cwd
                //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
                ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                    //res.send(JSON.stringify({"aaz":"aaz"})) // error coming here
                    if (!err) {
                        ftpClient.put( buffer, 'domains/cwac.in/public_html/temp_files/Excel.xlsx', function( err, list ) {
                            if ( err ) throw err;
                            ftpClient.end();     
                            res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                        });
                    }
                });
                //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
            });

            ftpClient.connect( {
                'host': 'ftp.cwac.in',
                'user': 'cwacin',
                'password': '$Rv01111996'
            } );
        })
});
app.post('/testurl_4', async (req, res) => {
    const templateFile = fs.readFileSync(path.resolve(__dirname, 'old_doc2.docx'), 'binary');
    const zip = new PizZip(templateFile);
    
    try {
        // Attempt to read all the templated tags
        let outputDocument = new Docxtemplater(zip);
    
        const dataToAdd = {
            employeeList: [
            { id: 28521, name: 'Frank', age: 34, city: 'Melbourne' },
            { id: 84973, name: 'Chloe', age: 28, city: 'Perth' },
            { id: 10349, name: 'Hank', age: 68, city: 'Hobart' },
            { id: 44586, name: 'Gordon', age: 47, city: 'Melbourne' },
            ],
            'title': req.body['entry1'],
            'description': req.body['entry2'],
            'body': req.body['entry3'],
            'Age': "19",
            'Address': "Flat 305, ABC",
            'Employees': "50"
        };
        // Set the data we wish to add to the document
        outputDocument.setData(dataToAdd);
    
        try {
            // Attempt to render the document (Add data to the template)
            outputDocument.render()
    
            // Create a buffer to store the output data
            let outputDocumentBuffer = outputDocument.getZip().generate({ type: 'nodebuffer' });
    
            // Save the buffer to a file
            fs.writeFileSync(path.resolve(__dirname, 'OUTPUT.docx'), outputDocumentBuffer);
            const ftpClient = new Ftp();
            ftpClient.on( 'ready', function() {
                //ftpClient.cwd
                //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
                ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                    //res.send(JSON.stringify({"aaz":"aaz"})) // error coming here
                    if (!err) {
                        ftpClient.put( outputDocumentBuffer, 'domains/cwac.in/public_html/temp_files/output.docx', function( err, list ) {
                            if ( err ) throw err;
                            ftpClient.end();     
                            console.log('done')
                            res.send(JSON.stringify({"OK": "OK"}))
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                        });
                    }
                });
                //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
            });
    
            ftpClient.connect( {
                'host': 'ftp.cwac.in',
                'user': 'cwacin',
                'password': '$Rv01111996'
            } );
        }
        catch (error) {
            console.error(`ERROR Filling out Template:`);
            console.error(error)
        }
    } catch(error) {
        console.error(`ERROR Loading Template:`);
        console.error(error);
    }
});
app.post('/generate_app_form', async (req, res) => {
    const templateFile = fs.readFileSync(path.resolve(__dirname, 'application_form.docx'), 'binary');
    const zip = new PizZip(templateFile);
    //const doc2pdf = require('doc2pdf');
    try {
        // Attempt to read all the templated tags
        let outputDocument = new Docxtemplater(zip);
    
        const dataToAdd = {
            'org_name': req.body['org_name'],
            'name_desig': req.body['name_desig'],
            'mob_no': req.body['mob_no'],
            'head_office': req.body['head_office'],
        };
        // Set the data we wish to add to the document
        outputDocument.setData(dataToAdd);
    
        try {
            // Attempt to render the document (Add data to the template)
            outputDocument.render()
    
            // Create a buffer to store the output data
            let outputDocumentBuffer = outputDocument.getZip().generate({ type: 'nodebuffer' });
    
            // Save the buffer to a file
            fs.writeFileSync(path.resolve(__dirname, 'OUTPUT.docx'), outputDocumentBuffer);
            //************************* converted PDF file is not exactly as same as word file
            //const docxConverter = require('docx-pdf');
            // docxConverter('./OUTPUT.docx','./OUTPUT.pdf', (err, result) => {
            //     if (err) console.log(err);
            //     else console.log(result); // writes to file for us
            //   });
            //******************************************************************************
            //************************* Exceptions when trying to execute
            // const path1 = require('path');
            // const fs1 = require('fs').promises;
            
            // const libre = require('libreoffice-convert');
            // libre.convertAsync = require('util').promisify(libre.convert);

            // const ext = '.pdf'
            // const inputPath = path1.join(__dirname, 'OUTPUT.docx');
            // const outputPath = path1.join(__dirname, `OUTPUT${ext}`);
        
            // // Read file
            // const docxBuf = await fs1.readFile(inputPath);
        
            // // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
            // let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);
            
            // // Here in done you have pdf file which you can save or transfer in another stream
            // await fs1.writeFile(outputPath, pdfBuf);
            //******************************************************************************
            //************************* 'soffice' is not recognized as an internal or external command
            // var toPdf = require("custom-soffice-to-pdf")
            // var fs1 = require("fs")
            // var wordBuffer = fs1.readFileSync("./OUTPUT.docx")

            // toPdf(wordBuffer).then(
            // (pdfBuffer) => {
            //     fs1.writeFileSync("./OUTPUT.pdf", pdfBuffer)
            // }, (err) => {
            //     console.log(err)
            // }
            // )
            //******************************************************************************
            //************************* unoconv command not found. Error: spawn unoconv ENOENT
            // const path1 = require('path');
            // const unoconv = require('awesome-unoconv');
            
            // const sourceFilePath = path1.resolve('./OUTPUT.docx');
            // const outputFilePath = path1.resolve('./OUTPUT.pdf');
            // unoconv.convert(sourceFilePath, outputFilePath)
            // .then(result => {
            //     console.log(result); // return outputFilePath
            // })
            // .catch(err => {
            //     console.log(err);
            // });
            //******************************************************************************
            //************************* Command failed. The system cannot find the path specified.
            // var toPdf = require("zapoj-office-to-pdf")
            // var fs1 = require("fs")
            // var wordBuffer = fs1.readFileSync("./OUTPUT.docx")

            // toPdf(wordBuffer).then(
            // (pdfBuffer) => {
            //     fs1.writeFileSync("./OUTPUT.pdf", pdfBuffer)
            // }, (err) => {
            //     console.log(err)
            // }
            // )
            //******************************************************************************
            //************************* 'soffice' is not recognized as an internal or external command
            // var toPdf = require("office-to-pdf")
            // var fs1 = require("fs")
            // var wordBuffer = fs1.readFileSync("./OUTPUT.docx")

            // toPdf(wordBuffer).then(
            // (pdfBuffer) => {
            //     fs1.writeFileSync("./OUTPUT.pdf", pdfBuffer)
            // }, (err) => {
            //     console.log(err)
            // }
            // )
            //******************************************************************************
            //****************************Successfully working but not in heroku
            const { wordToPdf } = require('node-docto');
            var buffer;
            res.send("ok")
            await wordToPdf('./OUTPUT.docx', './OUTPUT.pdf', {deleteOriginal: false}) // heroku throws error here
            //await wordToPdf('./OUTPUT.docx', buffer, {deleteOriginal: false})
            //await wordToPdf('./OUTPUT.docx', 'https://cwac.in/temp_files/OUTPUT.pdf', {deleteOriginal: false})
            .then(stdout => console.log(stdout));
            //******************************************************************************
            

            //var data = fs.readFileSync('./OUTPUT.pdf');

            //var data = fs.readFileSync('https://cwac.in/temp_files/OUTPUT.pdf');
            const ftpClient = new Ftp();
            ftpClient.on( 'ready', function() {
                //ftpClient.cwd
                //res.send(JSON.stringify({"aaz":"aaz"})) //error not coming here
                ftpClient.mkdir('domains/cwac.in/public_html/temp_files/', true, (err) => {
                    //res.send(JSON.stringify({"aaz":"aaz"})) // error coming here
                    if (!err) {
                        ftpClient.put( outputDocumentBuffer, 'domains/cwac.in/public_html/temp_files/output3.docx', function( err, list ) {
                        //ftpClient.put( data, 'domains/cwac.in/public_html/temp_files/output3.docx', function( err, list ) {
                        //ftpClient.put( data, 'domains/cwac.in/public_html/temp_files/output3.pdf', function( err, list ) {
                        //ftpClient.put( buffer, 'domains/cwac.in/public_html/temp_files/output3.pdf', function( err, list ) {
                            if ( err ) throw err;
                            ftpClient.end();     
                            console.log('done')
                            res.send(JSON.stringify({"OK": "OK"}))
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": req.body['entry1'], "Param2": req.body['entry2'], "Param3": req.body['entry3']}));
                            //res.send(JSON.stringify({"OK": "File Uploaded", "Param1": 'entry1', "Param2": 'entry2', "Param3": 'entry3'}));
                        });
                    }
                });
                //res.send(JSON.stringify({"aaz":"aaz"})) //error coming here
            });
    
            ftpClient.connect( {
                'host': 'ftp.cwac.in',
                'user': 'cwacin',
                'password': '$Rv01111996'
            } );
        }
        catch (error) {
            console.error(`ERROR Filling out Template:`);
            console.error(error)
        }
    } catch(error) {
        console.error(`ERROR Loading Template:`);
        console.error(error);
    }
});
//End of adding on 5-Apr-2022
app.listen(process.env.PORT || 5000,()=>
{
    console.log(`APP IS RUNNING AT 5000`)
})