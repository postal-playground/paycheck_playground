function open_page(tab) {
  var i;
  var x = document.getElementsByClassName("tab");
  for (i = 0; i < x.length; i++) {
    console.log(x[i]);
    x[i].classList.add("hidden");
  }
  document.getElementById(tab).classList.remove("hidden");
}
