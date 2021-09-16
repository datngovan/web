var cors = require('cors')
var express = require('express');
var app = express();
app.use(cors())
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const path = require('path');


var bcrypt = require('bcryptjs');

var jwt = require('jsonwebtoken');

const nodemailer = require("nodemailer");
app.use(express.static(path.resolve(__dirname, 'build')));

require('dotenv').config();

app.use(bodyParser.json({
    limit: '50mb'
  }));
  
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: true 
  }));
mongoose.connect('mongodb+srv://rmit1:123@cluster0.jiodv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');
var CustomerSchema = new mongoose.Schema({
    id: String,
    customerName: String,
    customerPassword: String,
    lastName: String,
    firstName: String,
    address: String,
    food: [{food_id: String, provider:String}],
    token: String,
    verificationCode: Number
});
var Customer = mongoose.model('Customer', CustomerSchema);
var FoodSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    image: String,
    ingredients: [{ingredientName: String, ingredientNum: Number, ingredientLast: String}],
    
    diet: [{dietName: String}],
    
    steps: [{stepNum: Number, stepDetail: String}],
    calories: Number,
    customerId: String
});
var Food = mongoose.model('Food', FoodSchema);
var CommentSchema = new mongoose.Schema({
    id: String,
    customerId: String,
    foodId: String,
    text: String,
    date: Date
});
var Comment = mongoose.model('Comment', CommentSchema);

var findindexelement = (array, value)=>{
    var result = -1;
    if (0 != array.length) {
        for (let i = 0; i < array.length; ++i) {
            if (value.food_id == array[i].food_id) {
                if (value.provider == array[i].provider){
                    result = i;
                }              
            }
        }
    } else {
        result = -1;
    }
    return result;
};

function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
}


var tokenPlace = (req, response, next) => {
    
    const token = req.headers["x-access-token"];
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded;
    } catch(err) {
        return response.send("invalid token");
    }
    return next();
};
app.get('/customer/placePlaceplace/:customerName/:customerPassword', function(req, response) {
    
    
    Customer.find({customerName: req.params.customerName}, async function(err, customer) {

        if (0 == customer.length) {
            var result = [{invalid: "invalid"}];
            response.send(result);
        } else {
            

            const name = customer[0].customerName;
            if (! (await bcrypt.compare(req.params.customerPassword, customer[0].customerPassword))) {
                var result = [{invalid: "invalid"}];
                response.send(result);
            } else {
                
                const token = jwt.sign(
                    {user_id: customer[0].id, name},
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "2h",
                    }
                );
                Customer.findOneAndUpdate({id: customer[0].id}, {$set: {token: token}}, {new: true}, function(error, customerCustomer) {

                    var result = [{id: customer[0].id, token: token}];
                    response.send(result);
                });
                
            }
            
        }
    });
});
 
app.post('/customer/place', function(req, response) {
    
    Customer.find({customerName: req.body.customerName}, function(err, customer) {
        if (0 == customer.length) {
            var count = 0;
            Customer.find({}, async function(error, customers) {
                const name = req.body.customerName;
                for (let i = 0; i< customers.length; ++i) {
                    if (count < parseInt(customers[i].id.split("-")[1])) {
                        count = parseInt(customers[i].id.split("-")[1]);
                    }
                }
                count = count + 1;
                
                var customerId = "CUSTOMER-"+count;
                

                var encryptedPassword = await bcrypt.hash(req.body.customerPassword, 10);
                var result = {id: customerId, customerName: req.body.customerName, customerPassword: encryptedPassword, lastName: "NULL", firstName: "NULL", address: "NULL", food: [], token: "", verificationCode:0};
                
                const token = jwt.sign(
                    {user_id: result.id, name},
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "2h",
                    }
                    
                );
                result.token = token;
                Customer.create(result, function(errors, placeResult) {
                    response.send([placeResult]);
                });
            });
        } else {
            var result = [{invalid: "invalid"}];
            response.send(result);
        }
    });
});
app.put('/customer/place/place/place', tokenPlace, function(req, response) {
    
    
    Customer.findOneAndUpdate({id: req.body.id}, {$set: {lastName: req.body.lastName, firstName: req.body.firstName, address: req.body.address}}, {new: true}, function(err, customer) {
        
        response.send([customer]);
    });
});
app.get('/customer/place/place/:id', tokenPlace, function(req, response) {
    Customer.find({id: req.params.id}, function(err, customer) {
        response.send(customer);
    });
});

app.put('/customer/add/list', tokenPlace, function(req, response){
    Customer.find({id: req.body.id}, function(err, customer){
        var customerfood = customer[0].food;
        var findindex = findindexelement(customerfood,req.body.food);
        if(-1==findindex){
            customerfood.push(req.body.food);
        }else{
            customerfood.splice(findindex, 1);
        }
        Customer.findOneAndUpdate({id: req.body.id}, {$set: {food: customerfood}}, {new: true}, function(ok, customerfood){
            response.send([customerfood]);
        })
    })
});








app.get('/customers', tokenPlace, function(req, response) {
    Customer.find({}, function(err, customers) {
        response.send(customers);
    });
});
app.put('/customer/delete/list', tokenPlace, function(req, response){
    Customer.find({id: req.body.id}, function(err, customer){
        var customerfood = customer[0].food;
        var findindex = findindexelement(customerfood,req.body.food);
        customerfood.splice(findindex, 1);
        Customer.findOneAndUpdate({id: req.body.id}, {$set: {food: customerfood}}, {new: true}, function(ok, customerfood){
            response.send([customerfood]);
        })
    });
});
app.post('/customers', tokenPlace, function(req, response) {
    Customer.create(req.body, function(err, customer) {
        response.send(customer);
    });
});
app.delete('/customer/:id', tokenPlace, function(req, response) {
    Customer.deleteOne({id: req.params.id}, function(err, result) {
        response.send(result);
    });
});
app.post('/customers/reset/email', function(req, response) {
    Customer.find({}, function(err,customers){
        var reset_code = 0;
        while(true){
            reset_code = between(1000,9999);
            var count=0;
            for(let i=0;i < customers.length;i++){
                var another_random_code = customers[i].verificationCode;
                if(reset_code != another_random_code){
                    count=count+1;
                }
            }
            if(customers.length == count){
                break;
            }
        }
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'cooky.comp@gmail.com',
              pass: '2631988dd'
            }
          });
          
          var mailOptions = {
            from: 'cooky.comp@gmail.com',
            to: req.body.customerName,
            subject: 'Sending Email using Node.js',
            text: reset_code.toString()
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        Customer.findOneAndUpdate({customerName: req.body.customerName},{$set: {verificationCode: reset_code}}, {new: true}, function(error, reset_code){
            response.send([{ran_code: 7}]);
        });
    });
});
app.post('/customers/verify/code', function(req, response) {
    Customer.find({}, async function(err, customers){
        var count=0;
        for(let i=0;i<customers.length;i++){
            if(req.body.customerName==customers[i].customerName){
                if(req.body.verificationCode == customers[i].verificationCode){
                    count = 1;
                }
            }
        }
        if(count==0){
            response.send([{invalid: "Invalid"}])
        } else {
            if(req.body.verificationCode == 0){
                response.send([{invalid: "Invalid"}])
            }else {
                var encryptedPassword = await bcrypt.hash(req.body.customerPassword, 10);
                Customer.findOneAndUpdate({customerName: req.body.customerName},{$set: {verificationCode: 0,customerPassword: encryptedPassword}}, {new: true}, function(error, reset_code){
                    response.send([{ran_code: 8}]);
                });
            }
            
            
        }
    })
});
app.get('/food/place/place/:id', tokenPlace, function(req, response) {
    
    Food.find({id: req.params.id}, function(err, food) {
        response.send(food);
    });
});
app.post('/food/place/place',tokenPlace , function(req, response) {
    var count = 0;
    Food.find({}, function(err, food) {
        
        for (let i = 0; i< food.length; ++i) {
            if (count < parseInt(food[i].id.split("-")[1])) {
                
                
                count = parseInt(food[i].id.split("-")[1]);
            }
        }
        count = count + 1;
        
        var foodId = "FOOD-" + count;
        var result = {id: foodId, name: req.body.name, image: req.body.image, description: req.body.description, ingredients: req.body.ingredients, diet: req.body.diet, steps: req.body.steps, calories: req.body.calories, customerId: req.body.customerId};
        Food.create(result, function(error, foodResult) {
            response.send([foodResult]);
        });
    });
});
app.get('/food/place/food/:id', tokenPlace, function(req, response) {
    Food.find({customerId: req.params.id}, function(err, food) {
        response.send(food);
    });
});
app.get('/food', tokenPlace, function(req, response) {
    Food.find({}, function(err, food) {
        response.send(food);
    });
});
app.post('/food', tokenPlace, function(req, response) {
    Food.create(req.body, function(err, food) {
        response.send(food);
    });
});
app.delete('/food/:id', tokenPlace, function(req, response) {
    Customer.find({},function(err, customer){
        for(let i =0;i<customer.length;i++){
            var customerfood = customer[i].food;
            var findindex = findindexelement(customer[i].food,{food_id:req.params.id,provider:"customer"})
            if(-1==findindex){
            }else{
                customerfood.splice(findindex, 1);
            }
            Customer.findOneAndUpdate({id: customer[i].id}, {$set: {food: customerfood}}, {new: true}, function(ok, customerfood){
            })
        }
    })
    Food.deleteOne({id: req.params.id}, function(err, result) {
        response.send(result);
    });
});
app.put('/food/update/display', tokenPlace, function(req, response){
    Food.findOneAndUpdate({id: req.body.id},{$set: {name: req.body.name, image: req.body.image, description: req.body.description, ingredients: req.body.ingredients, diet: req.body.diet, steps: req.body.steps, calories: req.body.calories, customerId: req.body.customerId}}, {new: true}, function(ok, food){
        response.send(food);
    })
});
app.get('/food/search/:name',function(req, response){
    Food.find({}, function(err,food){
        let result = []
        for(let i =0; i< food.length;i++){
            let count = 0
            let foodName = food[i].name
            let foodPhrase = foodName.split(' ')
            let searchPhrase = req.params.name.split(' ')
            for(let j=0;j<searchPhrase.length;j++){
                if(foodPhrase.includes(searchPhrase[j])){
                    count ++;
                }
            }if(count == searchPhrase.length){
                result.push(food[i]);
            }
        }
        response.send(result);
    });
});
app.get('/comments/all/:foodId',tokenPlace, function(req,response){
    Comment.find({foodId: req.params.foodId}, function(err, comments){
        response.send(comments);
    })
});
app.post('/comments/place', tokenPlace, function(req,response){
    Comment.find({},function(err,comments){
        let count = 0;
        for(let i = 0; i < comments.length; i++){
            if(count< parseInt(comments[i].id.split('-')[1])){
                count = parseInt(comments[i].id.split('-')[1]);
            }
        }
        count = count + 1;
        let commentId = "COMMENT-" + count;
        let result = {id: commentId, customerId: req.body.customerId, foodId: req.body.foodId,text: req.body.text, date: req.body.date}
        Comment.create(result, function(rre,commented){
            response.send([commented]);
        })
    })
});
app.get('/comments',tokenPlace,function(req, response){
    Comment.find({},function(err,comment){
        response.send(comment);
    })
});
app.post('/comments',tokenPlace, function(req,response){
    Comment.create(req.body, function(err,comment){
        response.send(comment);
    })
});
app.delete('/comment/:id', tokenPlace, function(req, response){
    Comment.deleteOne({id: req.params.id}, function(err,comment){
        response.send(comment);
    })
});
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
   });
   
app.listen(9000);

