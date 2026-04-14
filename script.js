// const track = document.getElementById("track");

// let index = 3;
// const step = 340;

// track.style.transform = `translateX(-${index * step}px)`;

// function move(dir) {
//   index += dir;

//   track.style.transition = "transform 0.4s ease";
//   track.style.transform = `translateX(-${index * step}px)`;

//   setTimeout(() => {
//     if (index <= 2) {
//       track.style.transition = "none";
//       index = 7;
//       track.style.transform = `translateX(-${index * step}px)`;
//     }

//     if (index >= 8) {
//       track.style.transition = "none";
//       index = 3;
//       track.style.transform = `translateX(-${index * step}px)`;
//     }
//   }, 400);
// }



const track = document.getElementById("track");
const carousel = document.getElementById("carousel");

let index = 3; // start after clones
const step = 340;

track.style.transform = `translateX(-${index * step}px)`;

/* MOVE FUNCTION */
function move(dir) {
  index += dir;

  track.style.transition = "transform 0.4s ease";
  track.style.transform = `translateX(-${index * step}px)`;

  setTimeout(() => {
    if (index <= 2) {
      track.style.transition = "none";
      index = 7;
      track.style.transform = `translateX(-${index * step}px)`;
    }

    if (index >= 8) {
      track.style.transition = "none";
      index = 3;
      track.style.transform = `translateX(-${index * step}px)`;
    }
  }, 400);
}

/* AUTO SLIDE */
let autoSlide;

function startAutoSlide() {
  autoSlide = setInterval(() => {
    move(1);
  }, 2500);
}

function stopAutoSlide() {
  clearInterval(autoSlide);
}

startAutoSlide();

/* PAUSE ON HOVER */
carousel.addEventListener("mouseenter", stopAutoSlide);
carousel.addEventListener("mouseleave", startAutoSlide);