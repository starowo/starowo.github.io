const suspects = {
    'Xinghe': {
        'title': 'Xinghe Chen',
        'type': 'Victim',
        'description': 'A worker at papa’s freezeria. He is known for being constantly tired and confused, however, his skill in making milkshakes is unmatched, keeping his position secure.',
        'additional': 'Xinghe was last seen asleep behind the counter during the closing of papa’s freezeria for the day. <hr> <img src="certificate.png" alt="Death Certification" style="width: 100%;">'
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
    },
    'Info': {
        'title': 'Crime Summary',
        'type': 'Information',
        'description': '<img src="sketch.jpeg" alt="Death Certification" style="width: 100%;"><img src="key.jpeg" alt="Death Certification" style="width: 100%;">',
        'additional': 'Business was rather slow at Papa’s Freezeria on May 9, 2024. The establishment had been receiving large amounts of backlash following a famous social media influencer publicly stating that the food and service were the absolute worst. Fernando was very upset with Xinghe, the employee of the month at the time, from the low turnout, as he was responsible for the harsh review. Despite this, some people would enter the building and purchase a milkshake; some just to see if it was bad, while others had not heard the news. Taylor, a younger employee who had trained for less time, was determined to prove herself to management, making many milkshakes to do so. At around noon, Taylor had gone on her lunch break, leaving Xinghe to serve a customer; Karina and her 2 year old son. As he accidentally mixed up Karina’s order with another order ticket that was not thrown away, Xinghe added peanut butter cups to the milkshake. Once the child tried his milkshake, he experienced a terrible allergic reaction, leading to Karina quickly pulling out an epipen to help her son. In a fit of rage, Karina slammed the epipen onto a nearby table, walked up to Xinghe, and said that she “would kill [him]”. Following this encounter, all employees were fairly tense; with Xinghe practically being banned from making any more milkshakes. As the day went on, Taylor began to exhibit signs of illness, and believed that she should not be in the position to prepare food, and asked Xinghe to cover her for closing as she was sent home to rest. At night, Fernando had realized that Xinghe had fallen asleep behind the counter. He was immensely upset with his lack of motivation, leading to a heated argument about the possibility of a lawsuit from his carelessness. Fernando then said that arguing with Xinghe was not worth it, and had left before any physical altercation ensued, accidentally getting his hoodie caught in the door. Xinghe had fallen back asleep, and as he did so, Taylor returned to the establishment, fully dressed with shoe covers, a plastic cover, and a hair cap. Fueled with jealousy as Xinghe could continue to be the employee of the month, she used her father’s screwdriver to pry open the door, simulating a break-in. Seeing that Xinghe was asleep, Taylor grabbed a nearby blender and slowly crept toward him. “How do you succeed so much when you don’t try?” is claimed to be the last thing she asked Xinghe before she struck him a total of 12 times in the head with the blender, shattering the device and leaving only a small part of the base. As she hit him, blood flew along the wall Xinghe had slept against. To move the body to make it more noticeable, Taylor tied the cord of the blender around Xinghe’s neck and dragged him to the service counter, leaving a trail of blood. As she stared at the body, Taylor had felt an otherworldly sense of power mixed with guilt. She touched Xinghe’s bloody wound but failed to realize that there were shards left in his head, leading to her accidentally cutting herself on the glass. Despite this, she hurried over to the employee of the month poster, tearing it down before wiping Xinghe’s blood over it. Upon doing this, Taylor realized that she had not cleaned the blood in the kitchen, leading her to run into the kitchen and grab a bottle of bleach from the corner. She hastily wiped up the trail that she had left behind before throwing the bottle of bleach away. Scared that someone would eventually find her, Taylor ran out the door and fled home to avoid being spotted, disposing all of her items in her fireplace. <br><br>The end'
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
            $('#popup-content #popup-title').html(suspects[info].title);
            $('#popup-content .type').html(suspects[info].type);
            $('#popup-content .classify').html('');
            $('#popup-content .popup-text').html(suspects[info].description);
            $('#popup-content .popup-additional').html(suspects[info].additional);
            $('#popup').css({
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1)'
            }).addClass('show').fadeIn();
        } else {
            var info = $(this).data('info');
            $('#suspect-info #popup-title').html(suspects[info].title);
            $('#suspect-info .type').html(suspects[info].type);
            $('#suspect-info .popup-text').html(suspects[info].description);
            $('#suspect-info .popup-additional').html(suspects[info].additional);
            $('#suspect-info').addClass('show');
        }
    });


    $('.evidence').on('click', function() {
        var info = $(this).data('info');
        $('#popup-content #popup-title').html(evidence[info].title);
        $('#popup-content .type').html(evidence[info].type);
        $('#popup-content .classify').html(evidence[info].classify);
        $('#popup-content .popup-text').html(evidence[info].description);
        $('#popup-content .popup-additional').html(evidence[info].additional);
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

    $('.switch-scene').on('click', function() {
        $('#crime-scene-main').removeClass('active');
        $('#crime-scene-backarea').addClass('active');
    });
    $('.switch-scene2').on('click', function() {
        $('#crime-scene-backarea').removeClass('active');
        $('#crime-scene-main').addClass('active');
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
            $('.suspect').css({
                'width': '30%',
                'margin-bottom': '20px'
            });
            $('.crime-scene-container').css('width', '100%');
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
            $('.suspect').css({
                'width': '10%',
                'margin-bottom': '0px'
            });
            $('.crime-scene-container').css({
                'width': '100%',
                'order': '0'
            });
            $('#suspect-info').show();
            $('#popup').removeClass('show').hide();
        }
    }

    adjustLayout(); // Initial layout adjustment
});
