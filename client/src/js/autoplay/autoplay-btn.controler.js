(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.getElementById('autoplay_button');
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        checkbox.closest('.toggle__button').classList.add('active');
      } else {
        checkbox.closest('.toggle__button').classList.remove('active');
      }
    });
  });
})();
