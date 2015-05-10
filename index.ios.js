'use strict';

var React = require('react-native');
var StyleSheet = require('StyleSheet');
var sleep = require('sleep');
var {
    AppRegistry,
    MapView,
    Text,
    TextInput,
    View,
    ListView,
    } = React;

var regionText = {
    latitude: '0',
    longitude: '0',
    latitudeDelta: '0',
    longitudeDelta: '0'
};

var mockedPosition = {
    latitude: 52.220572,
    longitude: 21.008520
};

var mockedRegion = {
    latitude: mockedPosition.latitude,
    longitude: mockedPosition.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
};

var shops = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

var myAnnotations = [];

var beerlurk;

var SearchInput = React.createClass({
    getInitialState: function () {
        return {
            searchText: ''
        };
    },

    _onChangeSearchText: function (text) {
        fetch('http://beer-lurk.herokuapp.com/find/' + text)
            .then(response => {
                shops = [];
                var locations = JSON.parse(response._bodyInit).beer_locations;
                locations.forEach(function (location) {

                    var elements = location.address_with_name.split(',');
                    var locationQuery = elements[0] + ', ' + elements[1];

                    var apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
                    var encodedUrl = apiUrl + encodeURIComponent(locationQuery);

                    sleep.sleep(0.1);
                    fetch(encodedUrl)
                        .then(response => {
                            var result = JSON.parse(response._bodyInit).results[0];
                            //[{latitude: number, longitude: number, title: string, subtitle: string}]

                            var newAnnotation = {
                                latitude: result.geometry.location.lat,
                                longitude: result.geometry.location.lng,
                                title: result.formatted_address
                            };
                            myAnnotations.push(newAnnotation);


                            //shops.cloneWithRows(annotations);
                            console.log(newAnnotation);
                            console.log(result.geometry.location.lat);
                            console.log(result.geometry.location.lng);
                            console.log(result.formatted_address);
                            console.log(myAnnotations);

                            beerlurk.setState('myownannotations', myAnnotations);
                        });
                });
            })
            .catch(error => console.log(error));
    },

    render: function () {
        return (
            <View style={styles.textInputWrapper}>
                <TextInput
                    value={this.state.searchText}
                    style={styles.searchInput}
                    onChangeText={this._onChangeSearchText}
                    selectTextOnFocus={true}
                    placeholder={'Type beer name'}
                    />
            </View>
        );
    }
});

var MapRegionInput = React.createClass({
    propTypes: {
        region: React.PropTypes.shape({
            latitude: React.PropTypes.number.isRequired,
            longitude: React.PropTypes.number.isRequired,
            latitudeDelta: React.PropTypes.number.isRequired,
            longitudeDelta: React.PropTypes.number.isRequired,
        }),
        onChange: React.PropTypes.func.isRequired,
    },

    getInitialState: function () {
        return {
            region: {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0,
                longitudeDelta: 0,
            }
        };
    },

    componentWillReceiveProps: function (nextProps) {
        this.setState({
            region: nextProps.region || this.getInitialState().region
        });
    },

    render: function () {
        var region = this.state.region || this.getInitialState().region;
        return (
            <View>
                <View style={styles.row}>
                    <Text>
                        {'Latitude'}
                    </Text>
                    <TextInput
                        value={'' + region.latitude}
                        style={styles.textInput}
                        onChange={this._onChangeLatitude}
                        selectTextOnFocus={true}
                        />
                </View>
                <View style={styles.row}>
                    <Text>
                        {'Longitude'}
                    </Text>
                    <TextInput
                        value={'' + region.longitude}
                        style={styles.textInput}
                        onChange={this._onChangeLongitude}
                        selectTextOnFocus={true}
                        />
                </View>
                <View style={styles.row}>
                    <Text>
                        {'Latitude delta'}
                    </Text>
                    <TextInput
                        value={'' + region.latitudeDelta}
                        style={styles.textInput}
                        onChange={this._onChangeLatitudeDelta}
                        selectTextOnFocus={true}
                        />
                </View>
                <View style={styles.row}>
                    <Text>
                        {'Longitude delta'}
                    </Text>
                    <TextInput
                        value={'' + region.longitudeDelta}
                        style={styles.textInput}
                        onChange={this._onChangeLongitudeDelta}
                        selectTextOnFocus={true}
                        />
                </View>
                <View style={styles.changeButton}>
                    <Text onPress={this._change}>
                        {'Change'}
                    </Text>
                </View>
            </View>
        );
    },

    _onChangeLatitude: function (e) {
        regionText.latitude = e.nativeEvent.text;
    },

    _onChangeLongitude: function (e) {
        regionText.longitude = e.nativeEvent.text;
    },

    _onChangeLatitudeDelta: function (e) {
        regionText.latitudeDelta = e.nativeEvent.text;
    },

    _onChangeLongitudeDelta: function (e) {
        regionText.longitudeDelta = e.nativeEvent.text;
    },

    _change: function () {
        this.setState({
            latitude: parseFloat(regionText.latitude),
            longitude: parseFloat(regionText.longitude),
            latitudeDelta: parseFloat(regionText.latitudeDelta),
            longitudeDelta: parseFloat(regionText.longitudeDelta),
        });
        this.props.onChange(this.state.region);
    },

});

var beerlurk = React.createClass({

    getInitialState() {
        return {
            mapRegion: null,
            mapRegionInput: null,
            annotations: null,
            isFirstLoad: true,
        };
    },

    render() {
        return (
            <View>
                <SearchInput/>
                <MapView
                    style={styles.map}
                    onRegionChange={this._onRegionChange}
                    onRegionChangeComplete={this._onRegionChangeComplete}
                    region={mockedRegion}
                    showsUserLocation={true}
                    annotations={this.state.myownannotations}
                    />
                <MapRegionInput
                    onChange={this._onRegionInputChanged}
                    region={this.state.mapRegionInput}
                    />

            </View>
        );
    },

    _getAnnotations(region) {
        return [{
            longitude: region.longitude,
            latitude: region.latitude,
            title: 'You Are Here',
        }];
    },

    _onRegionChange(region) {
        this.setState({
            mapRegionInput: region,
        });
    },

    _onRegionChangeComplete(region) {
        if (this.state.isFirstLoad) {
            this.setState({
                mapRegionInput: region,
                annotations: this._getAnnotations(region),
                isFirstLoad: false,
            });
        }
    },

    _onRegionInputChanged(region) {
        this.setState({
            mapRegion: region,
            mapRegionInput: region,
            annotations: this._getAnnotations(region),
        });
    },
});

var styles = StyleSheet.create({
    textInputWrapper: {
        paddingTop: 24
    },
    searchInput: {
        flex: 1,
        alignItems: 'stretch',
        height: 40,
        backgroundColor: '#ff00ff',
        paddingLeft: 16,
        paddingRight: 16,
        color: '#121212'
    },
    map: {
        height: 250,
        margin: 10,
        borderWidth: 1,
        borderColor: '#000000',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    textInput: {
        width: 150,
        height: 20,
        borderWidth: 0.5,
        borderColor: '#aaaaaa',
        fontSize: 13,
        padding: 4,
    },
    changeButton: {
        alignSelf: 'center',
        marginTop: 5,
        padding: 3,
        borderWidth: 0.5,
        borderColor: '#777777',
    },
    list: {
        backgroundColor: '#c00',
        height: 200

    }
});

exports.title = '<MapView>';
exports.description = 'Base component to display maps';
exports.examples = [
    {
        title: 'Map',
        render(): ReactElement {
            return <MapViewExample />;
        }
    },
    {
        title: 'Map shows user location',
        render() {
            return <MapView style={styles.map} showsUserLocation={true}/>;
        }
    }
];

AppRegistry.registerComponent('beerlurk', () => beerlurk);