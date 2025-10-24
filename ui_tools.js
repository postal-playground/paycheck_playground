function open_page(tab) {
  var i;
  var x = document.getElementsByClassName("tab");
  for (i = 0; i < x.length; i++) {
    x[i].classList.add("hidden");
  }
  document.getElementById(tab).classList.remove("hidden");
}

function insert_element(element, location_id, before = false) {
    let insert_location = document.getElementById(location_id);
    if (before) {
        insert_location.insertBefore(element, insert_location.children[0]);
    } else {
        insert_location.appendChild(element);
    }
}
