
    let total = 8;
    let available = 6;

    function addVolunteer() {
      total++;
      available++;

      document.getElementById("total").innerText = total;
      document.getElementById("available").innerText = available;
    }
window.onload = function () {
  let total = localStorage.getItem("total") || 8;
  let available = localStorage.getItem("available") || 6;

  document.getElementById("total").innerText = total;
  document.getElementById("available").innerText = available;
};