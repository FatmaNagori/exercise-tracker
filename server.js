const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true } )
mongoose.set("useFindAndModify",false)
const Schema=mongoose.Schema;
const ExerciseSchema=new Schema({"username":String,"id":String,"data":[]});
const Exercise=mongoose.model("Exersice",ExerciseSchema)
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/exercise/log",(req,res)=>{
  var id=req.query.userId;
  var from=req.query.from;
  var to=req.query.to;
  var limit=req.query.limit;
  var obj={};
  var log;
  if(!id){
    res.send("unknown userId")
  }else {
    Exercise.findOne({"id":id},(err,data)=>{
      if(err){return err}
      else{
        if (data===null){res.send("unknown userId")}
        else{
           obj._id=id
           obj.username=data.username ;
           var fromDate=new Date(from);
           var toDate=new Date(to);
           if(!from && !to){
             log=data.data.sort((a,b)=>new Date(a)-new Date(b));
             if(limit){
                if(limit>=log.length){obj.count=log.length;obj.log=log}
                else{obj.count=limit;obj.log=log.slice(0,parseInt(limit))}
             }
             else{
             obj.count=log.length;
             obj.log=log;
             }
           }
           else if(from && to){
             if(fromDate.toString()=="Invalid Date" && toDate.toString()=="Invalid Date"){
              log=data.data.sort((a,b)=>new Date(a)-new Date(b));
             if(limit){
                if(limit>=log.length){obj.count=log.length;obj.log=log}
                else{obj.count=limit;obj.log=log.slice(0,parseInt(limit))}
             }
             else{
             obj.count=log.length;
             obj.log=log;
             }
             }
             else if (fromDate.toString()=="Invalid Date" && toDate.toString()!=="Invalid Date"){
                obj.to=toDate.toUTCString().substring(0,16);
                log=data.data.filter(a=>new Date(a.date)<toDate).sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit))}
                }
             }
             else if(fromDate.toString()!=="Invalid Date" && toDate.toString()=="Invalid Date"){
                obj.from=fromDate.toUTCString().substring(0,16);
                log=data.data.filter(a=>new Date(a.date)>=fromDate).sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit))}
                }
             }
             else{
                obj.from=fromDate.toUTCString().substring(0,16);
                obj.to=toDate.toUTCString().substring(0,16);
                log=data.data.filter(a=>new Date(a.date)>=fromDate && new Date(a.date)<toDate).sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit));}
                }
             }
           }
           else if(from &&!to){
              if (fromDate.toString()!=="Invalid Date"){
                obj.from=fromDate.toUTCString().substring(0,16);
                log=data.data.filter(a=>new Date(a.date)>=fromDate).sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log;}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log;}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit));}
                }    
              }
             else{
                log=data.data.sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log;}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log;}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit));}
                }
             }
           }
           else if(to &&!from){
             if(toDate.toString()!=="Invalid Date"){
                obj.to=toDate.toUTCString().substring(0,16);
                log=data.data.filter(a=>new Date(a.date)>=fromDate).sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit))}
                }
             }
             else{
                log=data.data.sort((c,b)=>c.date-b.date);
                if (!limit){obj.count=log.length;obj.log=log;}
                else{
                  if (limit>=log.length){obj.count=log.length;obj.log=log;}
                  else{obj.count=limit;obj.log=log.slice(0,parseInt(limit));}
                }
             }
           }

    res.json(obj)
        }
      }
    })

  
  }
})

app.post("/api/exercise/add",(req,res)=>{
  var userId=req.body.userId;
  var description=req.body.description;
  var duration=req.body.duration;
  var date=req.body.date;
  if(userId){
    Exercise.findOne({"id":userId},(err,data)=>{
     if (err){return err}
     else{
        if (data==null){res.send("unknown Id")}
        else{
    if(description){
        if (duration){
          if(date){
            var adddate=new Date(date);
            if(adddate=="Invalid Date"){
                res.send('Cast to Date failed for value "'+date+'" at path "date"')
            }
            else{
              adddate=adddate.toUTCString().substring(0,16)
              Exercise.findOneAndUpdate({"id":userId},
                {$push:{"data":{"description":description,"duration":duration,"date":adddate}}},
               {new:true},
               (err,data)=>{
                 if (err){return err}
                 else{
                   res.json({"username":data.username,"_id":data.id,"description":description,"duration":duration,"date":adddate})
               }
            })
          }}
          else{
            adddate=new Date().toUTCString().substring(0,16)
            Exercise.findOneAndUpdate({"id":userId},
                {$push:{"data":{"description":description,"duration":duration,"date":adddate}}},
               {new:true},
               (err,data)=>{
                 if (err){return err}
                 else{
                   res.json({"username":data.username,"_id":data.id,"description":description,"duration":duration,"date":adddate})
               }
            })
          }
          
    
        }
        else{
          res.send("Path `duration` is required.")
        }
    }
    else{res.send("Path `description` is required.")}
        }
     }
    })

    
  }else{
    res.send("unknown _id")
  }

})

app.post("/api/exercise/new-user",(req,res)=>{
  var username=req.body.username
  var id=new Date().getTime().toString(36);
  Exercise.findOne({"username":username},(err,data)=>{
    if (err){return err}
    else{
      if (data===null){
        var user=new Exercise({"username":username,"id":id})
        user.save((err,data)=>err?err:data)
        res.json({"username":username,"_id":id})
      }
      else{
        res.send("username already taken")
      }
    }
  })
  
  
  
  
})
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
