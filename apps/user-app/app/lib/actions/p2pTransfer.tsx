"use server"
import {getServerSession} from "next-auth";
import {authOptions} from "../auth"
import prisma from "@repo/db/client";
import { Asul } from "next/font/google";

export async function p2pTransfer(to:string,amount:number) {
    const session = await getServerSession(authOptions)
    const from = session?.user.id;
    if(!from){
        return{
            message : "Error while sending"
        }
    }
    const toUser = await prisma.user.findFirst({
        where:{
            number :to
        }
    })
    if(!toUser){
        return{
            message :"User not found"
        }
    }
    await prisma.$transaction(async(tx)=>{

        //lock row
        await tx.$queryRaw`Select * From "Balance" WHERE "userid = ${Number(from)} FOR UPDATE`
        const fromBalance = await tx.balance.findUnique({
            where:{
                userid : Number(from)
            }
        })
        if(!fromBalance || fromBalance.amount <amount){
            throw new Error("insufficient funds")
        }
        await tx.balance.update({
            where:{userid : Number(from)},
            data:{
                amount :{decrement  :amount}
            }
        })
        await tx.balance.update({
            where:{userid:Number(from)},
            data:{amount:{increment:amount}}
        })
        await tx.p2pTransfer.create({
        data:{
          fromUserid : from,
          toUserid :toUser.id,
          amount,
          timestamp: new Date()
        }})
        
    })
}