import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'


const dbConnect = async ()=>{
    try {
        const connectInstance = await mongoose.connect(`${process.env.URL}/${DB_NAME}`)
        console.log('\nDatabase connected:',connectInstance.connection.host)
    }
    catch(error){
        console.log('Error!!!:',error)
        process.exit(1)
    }
}


export default dbConnect