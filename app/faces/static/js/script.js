/* Script */
$(document).ready(function() {
    $('#imageselector').change(function() {
        var file = document.querySelector('input[type=file]').files[0];
        var reader = new FileReader();

        reader.addEventListener("load", function() {
            var image = new Image();
            image.onload = function() {
                EXIF.getData(image, function() {
                    var orientation = EXIF.getTag(this, "Orientation");
                    alert(orientation);
                });
                image.src = reader.result;

                resizeImage(reader.result, 480, 480, function(newurl) {
                    $('#preview').attr("src", newurl);
                    $('#photoclicker').addClass("d-none");
                    $('#preview').removeClass("d-none");
                    $('#submitbutton').removeClass("d-none");
                });
            };
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    });
});


function resizeImage(url, width, height, callback) {
    var sourceImage = new Image();

    sourceImage.onload = function() {
        // Create a canvas with the desired dimensions
        var canvas = document.createElement("canvas");

        if (sourceImage.width > sourceImage.height) {
            canvas.width = width;
            canvas.height = Math.round((sourceImage.height / sourceImage.width) * width);
        } else {
            canvas.height = height;
            canvas.width = Math.round((sourceImage.width / sourceImage.height) * height);
        }

        // Scale and draw the source image to the canvas
        canvas.getContext("2d").drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to a data URL in PNG format
        callback(canvas.toDataURL());
    }

    sourceImage.src = url;
}