document.addEventListener('DOMContentLoaded', function () {
    var logo = document.getElementById('logo');
    var navigation = document.getElementById('navigation');

    logo.addEventListener('click', function () {
        // Toggle the 'expanded' class on the navigation
        navigation.classList.toggle('expanded');

        // If the navigation is expanded, add the 'collapsed' class after a delay
        if (!navigation.classList.contains('expanded')) {
            setTimeout(function () {
                navigation.classList.add('collapsed');
            }, 300); // Should match the transition duration in CSS
        } else {
            // If the navigation is collapsed, remove the 'collapsed' class immediately
            navigation.classList.remove('collapsed');
        }
    });
});
