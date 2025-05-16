document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.createElement("img");
  lightbox.appendChild(lightboxImg);

  lightbox.addEventListener("click", () => {
    lightbox.style.display = "none";
  });

  document.querySelectorAll(".gallery img").forEach((img) => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.style.display = "flex";
    });
  });
});
