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
                resizeImage(reader.result, 480, degrees, function(newurl) {
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


function resizeImage(url, size, degrees, callback) {
    var sourceImage = new Image();

    sourceImage.onload = function() {
        // Create a canvas with the desired dimensions
        var canvas = document.createElement("canvas");

        var scaleX = 1;
        var scaleY = 1;

        if (degrees == 90 || degrees == 270) {
            canvas.width = sourceImage.height;
            canvas.height = sourceImage.width;
            scaleX = size / sourceImage.height;
            scaleY = scaleX;
        } else {
            canvas.width = sourceImage.width;
            canvas.height = sourceImage.height;
            scaleX = size / sourceImage.width;
            scaleY = scaleX;
        }


        var drawx = Math.round(canvas.width / 2) * -1;
        var drawy = Math.round(canvas.height / 2) * -1;

        // Scale to right dimensions
        canvas.height = Math.round((canvas.height / canvas.width) * size);
        canvas.width = size;




        var ctx = canvas.getContext("2d");
        //ctx.translate(parseInt(canvas.width / 2), parseInt(canvas.height / 2));
        ctx.setTransform(scaleX, 0, 0, scaleY, Math.round(canvas.width / 2), Math, round(canvas.height / 2));
        ctx.rotate(degrees * Math.PI / 180);
        ctx.drawImage(sourceImage, drawx, drawy);

        /*
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
        */
        callback(canvas.toDataURL());
    };

    sourceImage.src = url;
}