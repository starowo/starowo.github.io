const suspects = {
    'Xinghe': {
        'title': 'Xinghe Chen',
        'type': 'Victim',
        'description': 'A worker at papa’s freezeria. He is known for being constantly tired and confused, however, his skill in making milkshakes is unmatched, keeping his position secure.',
        'additional': 'Xinghe was last seen asleep behind the counter during the closing of papa’s freezeria for the day.'
    },
    'Karina': {
        'title': 'Karina Yu',
        'type': 'Suspect',
        'description': 'Karina was very paranoid about the livelihood of her 2 year old son due to being a first-time single mother. Xinghe had accidentally given Karina’s son a milkshake with peanut butter cups, which led to a severe allergic reaction. Karina was upset and threatened aggression against Xinghe before leaving.',
        'additional': 'Karina was at the hospital the night of Xinghe’s murder for the treatment of her son. This alibi was confirmed by the workers of the hospital she had went to.'
    },
    'Fernando': {
        'title': 'Fernando Sanchez',
        'type': 'Suspect',
        'description': 'As the manager of the establishment, Fernando was constantly upset with Xinghe due to his lack of motivation driving customers away. He would occasionally act out against Xinghe’s laziness.',
        'additional': 'Fernando claimed that he was not responsible for closing Papa’s Freezeria that night, and had instead gone to run errands. This alibi was confirmed by Taylor.'
    },
    'Taylor': {
        'title': 'Taylor Talada',
        'type': 'Suspect',
        'description': 'She always wished for order in the establishment, and was constantly working overtime to keep people coming back. Xinghe had won the employee of the month award, which she was fairly upset with, and she was allegedly seen arguing with management over it.',
        'additional': 'Taylor stated that she was not at work the night of the murder, as she began to suffer with cold symptoms. She went home promptly so she could rest for the morning. She claimed that Xinghe had agreed to cover for her. This alibi was confirmed by Fernando.'
    }   
}

const evidence = {
    'blood1': {
        'title': 'Blood on Glass Shards',
        'type': 'Circumstantial',
        'classify': 'Biological',
        'description': 'the blood on the glass can be tested with blood typing analysis, where the blood is mixed with different antibody serums, and if the blood agglutinates, the antigen is present in the blood. ',
        'additional': 'matches Taylor Talada'
    },
    'entry': {
        'title': 'Signs of Forced Entry',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'toolmark analysis can be used by attempting to match the indentation made by the tool to various kinds of tools or items. this can determine what kind of tool was used to break into the building.',
        'additional': 'matches Karina Yu'
    },
    'fabric': {
        'title': 'Fabric Caught in Doorway',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'since there is not much fabric in the sample, the fibers would be tested through infrared spectroscopy (different fibers react differently in contact with infrared light) and polarizing light microscopy (can analyze patterns to determine whether or not the fiber is natural, and what dyes were used)',
        'additional': 'matches Fernando Sanchez'
    },
    'epipen': {
        'title': 'Used Epipen',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'the epipen has latent fingerprints from use, which means that it can be dusted with black powder and can determine what minutiae patterns can be found on the fingerprints of the person who used it. ',
        'additional': 'matches Karina Yu'
    },
    'blood2': {
        'title': 'Blood Spatter on Wall',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'by using blood spatter analysis, the lengths of the blood drops and direction the tail of each drop is facing can determine what position xinghe was in when he was initially struck, and the velocity of which he was.',
        'additional': 'matches All Suspects'
    },
    'blood3': {
        'title': 'Wiped Blood Smear',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'although some of the blood is wiped away, luminol can be used to reveal where the blood is located, and the transfer pattern can show where xinghe was moved from.',
        'additional': 'matches Taylor Talada'
    },
    'bottle': {
        'title': 'Bottle of Bleach',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'the bottle may have latent prints on it from people who have used it, so black powder can be used to see who had touched the cleaner.',
        'additional': 'matches Fernando Sanchez, Taylor Talada'
    },
    'poster': {
        'title': 'Vandalized Employee of the Month Poster',
        'type': 'Circumstantial',
        'classify': 'Physical',
        'description': 'the blood wiped along the poster is done by hand, which reveals visible prints on the surface. these prints can be compared to suspects’ fingerprints to find out who vandalized the poster with the victim’s own blood. ',
        'additional': 'matches Taylor Talada'
    }
}


$(document).ready(function() {
    $('.suspect').on('click', function() {
        if (window.innerWidth > window.innerHeight) {
            var info = $(this).data('info');
            var offset = $(this).offset();
            $('#popup-content #popup-title').text(suspects[info].title);
            $('#popup-content .type').text(suspects[info].type);
            $('#popup-content .classify').text('');
            $('#popup-content .popup-text').text(suspects[info].description);
            $('#popup-content .popup-additional').text(suspects[info].additional);
            $('#popup').css({
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1)'
            }).addClass('show').fadeIn();
        } else {
            var info = $(this).data('info');
            $('#suspect-info #popup-title').text(suspects[info].title);
            $('#suspect-info .type').text(suspects[info].type);
            $('#suspect-info .popup-text').text(suspects[info].description);
            $('#suspect-info .popup-additional').text(suspects[info].additional);
            $('#suspect-info').addClass('show');
        }
    });


    $('.evidence').on('click', function() {
        var info = $(this).data('info');
        $('#popup-content #popup-title').text(evidence[info].title);
        $('#popup-content .type').text(evidence[info].type);
        $('#popup-content .classify').text(evidence[info].classify);
        $('#popup-content .popup-text').text(evidence[info].description);
        $('#popup-content .popup-additional').text(evidence[info].additional);
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
