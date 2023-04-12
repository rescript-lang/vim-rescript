let greetUser = async (userId) => {
  let name = await getUserName(. userId)  
  "Hello " ++ name ++ "!"
}
