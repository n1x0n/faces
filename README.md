[![Build Status](https://drone.phight.club/api/badges/fredrik/faces/status.svg)](https://drone.phight.club/fredrik/faces)
# faces

Simple web application to upload selfies to NetApp StorageGRID. Any metadata associated with these selfies can then be displayed along with the picture.

## But, why?

I use this to demo the SNS Notification integration that NetApp StorageGRID has. In my demo, once the picture is uploaded I trigger an SNS notification that triggers a Lambda script. This Lambda script then uses facial analytics in the cloud to tag the image with relevant metadata. *(E.g. age, gender, mood.)*