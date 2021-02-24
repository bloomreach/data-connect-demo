now = () => {
    let today = new Date()
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    return time
}
  
log = (message, options) => {
    if(options){
        if(!options.noTime){
            message = now() + " " +  message
        }
    
        if(options.sameLineLogging){
            process.stdout.write(message + '                          \r')
        } else {
            console.log(message + '                           ')
        }        
    } else {
        message = now() + " " +  message
        console.log(message + '                           ')
    }
    return
}
  
module.exports = {
    log
}