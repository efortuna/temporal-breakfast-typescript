import { proxyActivities } from '@temporalio/workflow'
import * as activities from './activities'


const { getBowl, putBowlAway, addCereal, putCerealBackInBox, addMilk } =
 proxyActivities<typeof activities>({
   startToCloseTimeout: '1 minute'
 })

type Compensation = () => Promise<void>

export async function breakfastWorkflow(): Promise<void> {
 console.log('one')
 const compensations: Compensation[] = []
 try {
  console.log('two')
   await getBowl()
   compensations.unshift(putBowlAway)
   console.log('three')
   await addCereal()
   compensations.unshift(putCerealBackInBox)

   await addMilk()
 } catch (err) {
   await compensate(compensations)
   throw err
 }
}


const compensateInParallel = true


async function compensate(compensations: Compensation[]) {
 if (compensateInParallel) {
   const outcomes = await Promise.allSettled(compensations.map(comp => comp()))
   for (const outcome of outcomes) {
     if (outcome.status === 'rejected') {
       console.error(`failed to compensate: ${outcome.reason.message}`)
     }
   }
   return
 }


 for (const comp of compensations) {
   try {
     await comp()
   } catch (err) {
     console.error(`failed to compensate: ${err}`)
   }
 }
}
