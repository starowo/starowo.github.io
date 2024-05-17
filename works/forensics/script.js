$(document).ready(function() {
    $('.suspect').on('click', function() {
        if (window.innerWidth > window.innerHeight) {
            var info = $(this).data('info');
            var offset = $(this).offset();
            $('#popup-content').text(info);
            $('#popup').css({
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1)'
            }).addClass('show').fadeIn();
        } else {
            var info = $(this).data('info');
            $('#suspect-info-content').text(info);
            $('#suspect-info').addClass('show');
        }
    });

    $('.evidence').on('click', function() {
        var info = $(this).data('info');
        //$('#popup-content').text(info);
        $('#popup').css({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1)'
        }).addClass('show').fadeIn();
    });

    $('.close-btn').on('click', function() {
        $('#popup').removeClass('show').fadeOut();
        $('#popup').css('transform', 'translate(-50%, -50%) scale(0)');
    });

    $(window).on('resize', function() {
        adjustLayout();
    });

    function adjustLayout() {
        if (window.innerWidth > window.innerHeight) {
            // Horizontal layout adjustments
            $('#container').css('flex-direction', 'row');
            $('#suspects').css({
                'width': '20%',
                'flex-direction': 'column'
            });
            $('#crime-scene-container').css('width', '80%');
            $('#suspect-info').hide();
        } else {
            // Vertical layout adjustments
            $('#container').css('flex-direction', 'column');
            $('#suspects').css({
                'width': '100%',
                'flex-direction': 'row',
                'justify-content': 'space-around',
                'order': '1'
            });
            $('#crime-scene-container').css({
                'width': '100%',
                'order': '0'
            });
            $('#suspect-info').show();
            $('#popup').removeClass('show').hide();
        }
    }

    adjustLayout(); // Initial layout adjustment
});
