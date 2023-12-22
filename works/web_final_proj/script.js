document.addEventListener('DOMContentLoaded', function () {
    const toggleNavButton = document.getElementById('toggleNav');
    const navigation = document.getElementById('navigation');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');

    toggleNavButton.addEventListener('click', function () {
        navigation.style.display = (navigation.style.display === 'block') ? 'none' : 'block';
    });

    prevPageButton.addEventListener('click', function () {
        // Add logic for going to the previous page
        console.log('Previous Page Clicked');
    });

    nextPageButton.addEventListener('click', function () {
        // Add logic for going to the next page
        console.log('Next Page Clicked');
    });
});
