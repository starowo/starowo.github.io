$(() => {
    $("ul li a").on('click', (ev) => {
      $("div").addClass("hidden");
      $("#" + $(ev.target).html()).removeClass("hidden");
      $("li a").removeClass("active");
      $(ev.target).addClass("active");
    })
  });