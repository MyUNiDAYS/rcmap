var country_name_map = {
         'Brunei Darussalam': 'Brunei',
         'Congo': 'Republic of the Congo',
         'Congo, The Democratic Republic of the': 'Democratic Republic of the Congo',
         "Cote D'Ivoire": 'Ivory Coast',
         'Falkland Islands (Malvinas)': 'Falkland Islands',
         'French Southern Territories': 'French Southern and Antarctic Lands',
         'Guinea-Bissa': 'Guinea Bissau',
         'Iran, Islamic Republic of': 'Iran',
         "Korea, Democratic People's Republic of": 'North Korea',
         'Korea, Republic of': 'South Korea',
         "Lao People's Democratic Republic": 'Laos',
         'Moldova, Republic of': 'Moldova',
         'Palestinian Territory': 'West Bank',
         'Russian Federation': 'Russia',
         'Serbia': 'Republic of Serbia',
         'Syrian Arab Republic': 'Syria',
         'Tanzania, United Republic of': 'United Republic of Tanzania',
         'Timor-Leste': 'East Timor',
         'United States': 'United States of America'
};


var world_map;

var highlight_country = function(country_name) {
    return d3.select('path[data-country-name="' + country_name + '"]')
            .style('fill', '#00BCD3')
            .transition()
            .duration(5000)
            .style('fill', '#28303D');
};

var get_country_names = function() {
    var ret = [];
    d3.selectAll('path[data-country-name]')
        .each(function(d) {
            ret.push(d.properties.name);
        });
    return ret;
};

var addBubbles = function(bubbles) {
    var self = this;

    var projection = this._map.get('projection');
    var options = this.options.bubble_config;

    var bubbleContainer = this.svg.append('g').attr('class', 'bubbles');

    bubbleContainer
        .selectAll('circle.bubble')
        .data(bubbles)
        .enter()
        .append('svg:circle')
        .attr('cx', function(datum) {
            return projection([datum.longitude, datum.latitude])[0];
        })
        .attr('cy', function(datum, index) {
            return projection([datum.longitude, datum.latitude])[1];
        })
        .style('fill', function(datum) {
            var fillColor = self.getFillColor(datum);
            d3.select(this).attr('data-fill', fillColor);
            return fillColor;
        })
        .attr('class', 'bubble')
        .attr('r', 0)
        .transition()
        .duration(400)
        .attr('r', function(datum) {
            return datum.radius;
        })
        .each(function(d){
            var x = projection([d.longitude, d.latitude])[0];
            var y = projection([d.longitude, d.latitude])[1];
            var div = $('<div class="message" />').css({
                position:'absolute',
                'top': y,
                'left': x - 50,
                'color': self.getFillColor(d)
            });

            div.html(d.page_title);
            $('#map').append(div);
            div.width()
            div.addClass('hide');
            window.setTimeout(function(){
                div.remove();
            }, 2000);
        });
};

function socketServerConnection() {

}

socketServerConnection.init = function(ws_url, lid) {
    this.connect = function() {
        
        var connection = new ReconnectingWebSocket(ws_url);
        this.connection = connection;
        
        connection.onmessage = function(resp) {
           
            var data = JSON.parse(resp.data);
            
            world_map.options.bubbles = world_map.options.bubbles.slice(-20);
                        
            $('.bubbles').animate({
                    opacity: 0,
                    radius: 10
                },
                2000,
                null,
                function(){
                    this.remove();
                }
            );

            
            world_map.addBubbles([{
                radius: 4,
                latitude: data.geoIpResult.latitude,
                longitude: data.geoIpResult.longitude,
                page_title: "yay",
                fillKey: "yay"
            }]);

            var country_hl = highlight_country(data.geoIpResult.country_name);

            if (!country_hl[0][0])
                highlight_country(country_name_map[data.geoIpResult.country_name]);
        };
    
    };
};

$(document).ready(function() {

    world_map = $("#map").datamap({
        scope: 'world',
        bubbles:[],
        geography_config: {
            borderColor: '#25717E', // map country borders
            highlightOnHover: false,
            popupOnHover: false
        },
        bubble_config: {
            borderWidth: 0,
            animate: true
        },
        fills: {
            'defaultFill': '#28303D', // map country fill 
            'yay': '#FF0C3E'
        }
    });
    
    // Fake URL to wikipedia
    var socket = new socketServerConnection.init('ws://127.0.0.1:1212/');
    if (!socket.connection || socket.connection.readyState == 3)
        socket.connect();
    
    world_map.addBubbles = addBubbles;
});