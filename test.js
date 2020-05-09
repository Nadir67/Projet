TestPoints = new Meteor.Collection("testpoints");

var limit = 9;

if (Meteor.isClient) {

  var chartData = [],
    tempGaugeChart = null,
    humidGaugeChart = null,
    chart = null;
    
  AmCharts.ready(function(){
    humidGaugeChart = AmCharts.makeChart("humidchartdiv", {
      "type": "gauge",
      "theme": "none",    
      "axes": [{
          "axisThickness":1,
           "axisAlpha":0.1,
           "tickAlpha":0.1,
           "valueInterval":10,
          "bands": [{
              "color": "#5cb85c",
              "endValue": 30,
              "startValue": 0
          }, {
              "color": "#f0ad4e",
              "endValue": 50,
              "startValue": 30
          }, {
              "color": "#00BBFF",
              "endValue": 120,
              "innerRadius": "95%",
              "startValue": 50
          }],
          "bottomTextYOffset": -20,
          "endValue": 120
      }],
      "arrows": [{}]
    });

    tempGaugeChart = AmCharts.makeChart("tempchartdiv", {
      "type": "gauge",
      "theme": "none",    
      "axes": [{
          "axisThickness":1,
           "axisAlpha":0.1,
           "tickAlpha":0.1,
           "valueInterval":10,
          "bands": [{
              "color": "#FF6347",
              "endValue": 65,
              "startValue": 0
          }, {
              "color": "#5cb85c",
              "endValue": 80,
              "startValue": 65
          }, {
              "color": "#d9534f",
              "endValue": 120,
              "innerRadius": "95%",
              "startValue": 80
          }],
          "bottomTextYOffset": -20,
          "endValue": 120
      }],
      "arrows": [{}]
    });

    chart = AmCharts.makeChart("chartdiv", {
      "type": "serial",
      "theme": "none",
      "pathToImages": "http://www.amcharts.com/lib/3/images/",
      "legend": {
        "useGraphSettings": true
      },
      "dataProvider": chartData,
      "valueAxes": [{
        "id":"v1",
        "axisColor": "#fc022c",
        "axisThickness": 2,
        "gridAlpha": 2,
        "axisAlpha": 1,
        "position": "left",
        "maximum": 150,
        "minimum": 0,
        "title": "Temperature (F)"
      }, {
        "id":"v2",
        "axisColor": "#0099ff",
        "axisThickness": 2,
        "gridAlpha": 0,
        "axisAlpha": 1,
        "position": "right",
        "maximum": 150,
        "minimum": 0,
        "title": "Humidity (%)"
      }],
      "graphs": [{
        "valueAxis": "v1",
        "lineColor": "#fc022c",
        "bullet": "round",
        "bulletBorderThickness": 1,
        "hideBulletsCount": 30,
        "title": "Temp (F)",
        "valueField": "temp",
        "fillAlphas": 0
      }, {
        "valueAxis": "v2",
        "lineColor": "#0099ff",
        "bullet": "square",
        "bulletBorderThickness": 1,
        "hideBulletsCount": 30,
        "title": "Humidity (%)",
        "valueField": "humidity",
        "fillAlphas": 0
      }],
      "chartScrollbar": {},
      "chartCursor": {
        "cursorPosition": "mouse"
      },
      "categoryField": "date",
      "categoryAxis": {
        "parseDates": false,
        "axisColor": "#DADADA",
        "minorGridEnabled": true
      }
    });
  });

  //charger les points existants afin qu'ils etre affichés au publiers
  Meteor.startup(function () {
    Meteor.subscribe('points', {}, onReady = function() {
      //on ajoute dernier disque par la fonction réactive.
      var d = TestPoints.find({}, {sort: {time: 1}, limit: (limit - 1)});
      d.forEach(function(point) {
        updateChartAndGauges(point);
      });
    });
  });

  //on ajoute un nouveau point de données au graphique historique puis actualiser le graphique et les jauges
  updateChartAndGauges = function(point){
    chartData.push({date: moment(new Date(point.time)).format("h:mm:ss A"), temp: point.temp, humidity: point.humidity});
    $('#currDateTime').html(new Date(point.time).toLocaleString());
    if (chart && tempGaugeChart && humidGaugeChart) {
      chart.validateData(); 
      tempGaugeChart.arrows[0].setValue(point.temp);
      tempGaugeChart.axes[0].setBottomText(point.temp + ' F');
      humidGaugeChart.arrows[0].setValue(point.humidity); 
      humidGaugeChart.axes[0].setBottomText(point.humidity + '%');

    };
  };

  //appelé de maniére reactive pour ajouter un nouveau point au graphique historique et mettre a jour les jauges.
  Template.dashboard.jscharts = function(){
    var d = TestPoints.findOne({}, {sort: {time: -1}});
    if (d && chart){
      //S'il y a plus de points «limites» sur le graphique historique, supprimez le point le plus ancien.
      if (chartData.length > limit) {
        chartData.shift();
      }
      updateChartAndGauges(d);
    } 
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // Toutes les valeurs énumérées ci-dessous sont les valeurs par défaut
    collectionApi = new CollectionAPI({
      //authToken: '123456',               // Exiger que cette chaîne soit transmise à chaque demande
      apiPath: 'api',                      // Préfixe du chemin de l'API
      standAlone: false,                   // Exécuter en tant que serveur HTTP autonome (S)
      sslEnabled: false,                   // Désactiver / Activer SSL (autonome seulement)
      listenPort: 3005,                    // Port à écouter (autonome seulement)
      listenHost: undefined,               // hote auquel se lier (autonome seulement)
      //privateKeyFile: 'privatekey.pem',  // Fichier de clé privée SSL (utilisé uniquement si SSL est activé)
      //certificateFile: 'certificate.pem' // Fichier de clé du certificat SSL (utilisé uniquement si SSL est activé)
      //timeOut: 120000
    });

    collectionApi.addCollection(TestPoints, 'points', {
      //authToken: undefined,                   // Exiger que cette chaîne soit transmise à chaque demande
      methods: ['POST'],  // Autoriser la création
      before: {  // Ces méthodes, si elles sont définies, seront appelées avant que les actions POST / GET / PUT / DELETE soient effectuées sur la collection. Si la fonction retourne false, l'action sera annulée. Si vous retournez true, l'action aura lieu.
        POST: function(obj) { 
          //Ne stockez que le nombre d'enregistrements indiqué dans le graphique
          if (TestPoints.find().count() >= limit) {
            TestPoints.remove(TestPoints.findOne({}, {sort: {time: 1}})._id);
          };
          return true
          },  // fonction (obj) {retour vrai / faux;},
        GET: undefined,  // fonction (collectionID, objs) {return true / false;},
        PUT: undefined,  //fonction (collectionID, obj, newValues) {return true / false;},
        DELETE: undefined,  //fonction (collectionID, obj) {return true / false;}
      }
    });

    // Démarre le serveur API
    collectionApi.start();

    // publier des points de données
    Meteor.publish('points', function() {
      return TestPoints.find({}, {sort: {time: 1}, limit: limit});
      this.ready();
    });

  });
}