import dotenv from "dotenv"

import dbConnect from "./db/index.js"

dotenv.config({
    path: './env'
})

dbConnect()





// const port = process.env.PORT
// const app = express()

// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.URL}/${DB_NAME}`)
//         app.on(error,()=>{
//             console.error('Error:',error)
//             throw error
//         })
//         app.listen(port,()=>{
//             console.log("App is listening on port ",port)
//         })
//     } catch (error) {
//         console.error("Error:",error)
//         throw error
//     }
// })()