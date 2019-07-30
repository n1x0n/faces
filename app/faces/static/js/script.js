/* Script */
$(document).ready(function() {
    $('#imageselector').change(function() {
        var file = document.querySelector('input[type=file]').files[0];
        var reader = new FileReader();

        reader.addEventListener("load", function() {
            var image = new Image();
            var degrees = 0;
            image.onload = function() {
                EXIF.getData(image, function() {
                    orientation = EXIF.getTag(this, "Orientation");
                    switch (orientation) {
                        case 3:
                            degrees = 180;
                            break;
                        case 6:
                            degrees = 90;
                            break;
                        case 8:
                            degrees = 270;
                            break;
                    }
                });
                resizeImage(reader.result, 480, 480, degrees, function(newurl) {
                    $('#preview').attr("src", newurl);
                    $('#photoclicker').addClass("d-none");
                    $('#preview').removeClass("d-none");
                    $('#submitbutton').removeClass("d-none");
                });
            };
            image.src = reader.result;
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    });
});


function resizeImage(url, width, height, degrees, callback) {
    var sourceImage = new Image();

    sourceImage.onload = function() {
        // Create a canvas with the desired dimensions
        var canvas = document.createElement("canvas");


        if (degrees == 90 || degrees == 270) {
            canvas.width = sourceImage.height;
            canvas.height = sourceImage.width;
        } else {
            canvas.width = sourceImage.width;
            canvas.height = sourceImage.height;
        }

        var ctx = canvas.getContext("2d");
        ctx.rotate(degrees * Math.PI / 180);
        ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

        var dummy = new Image();
        var dummycanvas = document.createElement("canvas");
        dummy.src = canvas.toDataURL();

        if (dummy.width > dummy.height) {
            dummycanvas.width = width;
            dummycanvas.height = Math.round((dummy.height / dummy.width) * width);
        } else {
            dummycanvas.height = height;
            dummycanvas.width = Math.round((dummy.width / dummy.height) * height);
        }

        // Scale and draw the source image to the canvas
        var dummyctx = dummycanvas.getContext("2d");
        dummyctx.drawImage(dummy, 0, 0, dummycanvas.width, dummycanvas.height);

        // Convert the canvas to a data URL in PNG format
        callback(canvas.toDataURL());
    };

    sourceImage.src = url;
}