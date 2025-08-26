document.getElementById("signup-form").addEventListener('submit',(event) => {
  event.preventDefault();
  signup();
});
const signup = () => {
  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  console.log(`Name : ${name} , Email: ${email} , Password:${password}`);
  document.getElementById("message").innerText = "Sign up Succesful";
}