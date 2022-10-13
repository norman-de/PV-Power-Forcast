// This example shows how solar output can be calculated when the cloud cover were predicted by a weather service.
// This example shows which steps are necessary for the calculation. For a working script, however, it must be extended by further steps.

const rad = Math.PI / 180;
// to grad = / rad
// from grad = * rad 

const lat = 53.633622
const long = 9.997413

// https://pvpmc.sandia.gov/modeling-steps/1-weather-design-inputs/plane-of-array-poa-irradiance/calculating-poa-irradiance/poa-ground-reflected/
const albedo = 0.14

const node_altitude = 10 / 1000;        // in km
const node_area = 1.764                 //210mm x 210mm 3in1 cells (1/3 cuted) 5x8x3 (3x5*4 + 3x5*4 = 120cell) = (0.210mm * 5 * 0.210mm * 8) // https://www.cleanenergyreviews.info/blog/latest-solar-panel-cell-technology

// The following data can be taken from the solar cell data sheet
const temp_coef_Pmax = -0.34
const stc_temp = 25
const stc_node_efficiency = 20.8

// predicted outdoor temperature    
const temp = 10 || stc_temp     
const node_efficiency = (stc_node_efficiency + (temp_coef_Pmax * (temp - stc_temp))) / 100;

// Solar cell tilt
const node_tilt_angle = 30;

// Orientation of the solar cell to north
const node_orientation_angle = 180;

const node_tilt_zenite_angle = 90 - node_tilt_angle
const node_tilt = node_tilt_angle * rad;
const node_orientation = node_orientation_angle * rad;

// If objects shade the modules, minimum heights can be entered here for mornings and evenings from which the sun shines directly on the modules.
const sun_altitude_angle_day_start = 0
const sun_azimuth_angle_day_start = 0
const sun_altitude_angle_day_end = 0
const sun_azimuth_angle_day_end = 360

// This step uses the SunCalc JavaScript library
// https://github.com/mourner/suncalc
var SunCalc = {};
const sunPosition = SunCalc.getPosition(new Date().getTime(), lat, long);

// Adjust for suncalc's  orientation
if (sunPosition.azimuth > Math.PI) {
    sunPosition.azimuth -= Math.PI;
} else {
    sunPosition.azimuth += Math.PI;
}

const sun_altitude = sunPosition.altitude
const sun_altitude_angle = sun_altitude / rad
const sun_azimuth = sunPosition.azimuth
const sun_azimuth_angle = sun_azimuth / rad
const sun_zenith_angle = 90 - sun_altitude_angle
const sun_zenith = sun_zenith_angle * rad

if (sun_altitude >= 0) {

    airMass = 1 / Math.cos(sun_zenith);
    let directIrradiance = 1370 * ((1 - (0.14 * node_altitude)) * Math.pow(0.7, Math.pow(airMass, 0.678)) + (0.14 * node_altitude));

    // Cloud cover in percent, in this example 5% from the weather forecast for the hourly period
    // https://www.meteoblue.com/de/weather-api/forecast-api/flughafen-hamburg-fuhlsb%c3%bcttel_deutschland_3208174?apikey=DUMMYAPIKEY&packages%5B%5D=basic-15min&packages%5B%5D=solar-15min&tz=Europe%2FBerlin&format=json&temperature=C&windspeed=kmh&precipitationamount=mm&winddirection=degree&forecast_days=none&history_days=none
    // https://my.meteoblue.com/packages/basic-15min_clouds-1h_multimodel-1h?apikey=DUMMYAPIKEY&lat=53.6304&lon=9.98823&asl=16&format=json&tz=Europe%2FBerlin
    const cloud = 5 / 100

    directIrradiance = directIrradiance * (1 - 0.75 * Math.pow(cloud, 3))

    // diffuse moduleIrradiance
    let moduleIrradiance = (directIrradiance * 0.20 * ((Math.PI - node_tilt) / Math.PI));

    // direct moduleIrradiance
    if ((sun_altitude_angle > sun_altitude_angle_day_start || sun_azimuth_angle > sun_azimuth_angle_day_start) && (sun_altitude_angle > sun_altitude_angle_day_end || sun_azimuth_angle < sun_azimuth_angle_day_end)) {
        moduleIrradiance += directIrradiance * (Math.cos(sun_altitude)
        * Math.sin(node_tilt) * Math.cos(node_orientation - sun_azimuth)
        + Math.sin(sun_altitude) * Math.cos(node_tilt))
    }

    const power = moduleIrradiance * node_area * node_efficiency
}