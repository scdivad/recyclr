const apiKey = 'AIzaSyCeDiSxzFywppo21vSsM_4F5yuPXSPTp0w';
const address = 'recycle centers';
const url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Recycle%20near%20me&inputtype=textquery&locationbias=circle%%40.113418%2C-88.223807&fields=formatted_address%2Cname%2Crating%2Copening_hours%2Cgeometry&key=AIzaSyCeDiSxzFywppo21vSsM_4F5yuPXSPTp0w';
fetch(url)
  .then(response => response.json())
  .then(jsonData => console.log(jsonData))
  .catch(error => console.error(error));