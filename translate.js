export function loadGoogleTranslate() {
    // Dynamically create the script tag to load the Google Translate API
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

    // Append the script to the body of the document
    document.body.appendChild(script);

    // Define the googleTranslateElementInit function that will be called when the script loads
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement(
            { 
                pageLanguage: 'en', 
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                multilanguagePage: true // Ensures 'notranslate' class is respected
            },
            'google_translate_element'  // The div where the translate widget will appear
        );
    };
}
