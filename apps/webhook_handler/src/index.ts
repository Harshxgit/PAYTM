import express from "express";
import db from "@repo/db/client"
const app = express();
app.use(express.json())
app.post("/hdfcWebhook", async(req, res) => {
  //zod validation
  //TODO: HDFC bank should ideally send us a secret so we know this is sent by them
  //i dont know no but we can verify by jwt or fetch secret
  //const authorization = jwt.verify("toke",secret)
  const paymentinformation = ({
    token: String,
    userid: String,
    amount: String,
  } = {
    token: req.body.token,
    userid: req.body.user_identifier,
    amount: req.body.amount,
  });

  try{
    await db.$transaction([
        db.balance.updateMany({
          where :{
            userid : Number(paymentinformation.userid)
          },
          data :{
            amount:{
              increment : Number(paymentinformation.amount)
            }
          }

        }),
        db.onRamptransaction.updateMany({
          where :{
            token : paymentinformation.token
          },
          data :{
            status : "Success"
          }
        })
    ])
    res.json({
      message: "Captured"
  })
  }catch(e){
    console.error(e)
    res.status(411).json({
      message : "Error while processing webhook"
    })
  }
});
app.listen(3003)