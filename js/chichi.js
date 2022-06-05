async function getRandomDogs() {
    let url = "https://dog.ceo/api/breed/chihuahua/images/random";
    try {
      let res = await fetch(url);
      return await res.json();
    } catch (error) {
      console.log(error);
    }
  }
  const div = document.getElementsByClassName("home");
  const button = document.querySelector("button");
  const p = document.querySelector("p");
  
  async function renderDogs() {
    let dogs = await getRandomDogs();
    var dog = [];
    dog = new Image();
    dog.src = dogs.message;
    dog.width = "500";
    dog.height = "400";
    var images = document.getElementById("img");
    document.body.appendChild(dog);
    console.log(dog);
  }
  
  var count = 0;
  
  button.addEventListener("click", function () {
    count++;
    if (count <= 1) {
      p.innerText = `Você já gerou ${count} cachorrinho :)`;
    } else {
      p.innerText = `Você já gerou ${count} cachorrinhos :)`;
    }
  });
  