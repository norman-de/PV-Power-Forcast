// This example shows how solar output can be calculated when DNI GHI and DIF were predicted by a weather service.
// This example shows which steps are necessary for the calculation. For a working script, however, it must be extended by further steps.
// The formulas are from the following source https://pvpmc.sandia.gov/modeling-steps/1-weather-design-inputs/plane-of-array-poa-irradiance/

const rad = Math.PI / 180;
// to grad = / rad
// from grad = * rad

const lat = 53.633622;
const long = 9.997413;

// https://pvpmc.sandia.gov/modeling-steps/1-weather-design-inputs/plane-of-array-poa-irradiance/calculating-poa-irradiance/poa-ground-reflected/
const albedo = 0.14;

const node_altitude = 10 / 1000; // in km
const node_area = 1.764; //210mm x 210mm 3in1 cells (1/3 cuted) 5x8x3 (3x5*4 + 3x5*4 = 120cell) = (0.210mm * 5 * 0.210mm * 8) // https://www.cleanenergyreviews.info/blog/latest-solar-panel-cell-technology

// The following data can be taken from the solar cell data sheet
const temp_coef_Pmax = -0.34;
const stc_temp = 25;
const stc_node_efficiency = 20.8;

// predicted outdoor temperature
const temp = 10 || stc_temp;
const node_efficiency =
  (stc_node_efficiency + temp_coef_Pmax * (temp - stc_temp)) / 100;

// Solar cell tilt
const node_tilt_angle = 30;

// Orientation of the solar cell to north
const node_orientation_angle = 180;

const node_tilt_zenite_angle = 90 - node_tilt_angle;
const node_tilt = node_tilt_angle * rad;
const node_orientation = node_orientation_angle * rad;

// GNI, Global normal irradiance
// DIF, Diffuse radiation
// DNI, Direct Normal Irradiation
// GHI, Global Horizontal Irradiation
// DHI, Diffuse Horizontal Irradiation

// Forecast from weather service for the hourly period
// https://www.meteoblue.com/de/weather-api/forecast-api/flughafen-hamburg-fuhlsb%c3%bcttel_deutschland_3208174
// https://my.meteoblue.com/packages/basic-15min_solar-15min?apikey=DUMMYAPIKEY&lat=53.6304&lon=9.98823&asl=16&format=json&tz=Europe%2FBerlin
const dni = 200;
const ghi = 200;
const dif = 200;
const dhi = ghi - dif;

// If objects shade the modules, minimum heights can be entered here for mornings and evenings from which the sun shines directly on the modules.
const sun_altitude_angle_day_start = 0;
const sun_azimuth_angle_day_start = 0;
const sun_altitude_angle_day_end = 0;
const sun_azimuth_angle_day_end = 360;

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

const sun_altitude = sunPosition.altitude;
const sun_altitude_angle = sun_altitude / rad;
const sun_azimuth = sunPosition.azimuth;
const sun_azimuth_angle = sun_azimuth / rad;
const sun_zenith_angle = 90 - sun_altitude_angle;
const sun_zenith = sun_zenith_angle * rad;

if (sun_altitude >= 0) {
  // 𝐸GTI=𝐸BTI+𝐸DTI+𝐸RTI

  // angle of incidence
  const aoi = Math.acos(
    Math.cos(sun_zenith) * Math.cos(node_tilt) +
      Math.sin(sun_zenith) *
        Math.sin(node_tilt) *
        Math.cos(sun_azimuth - node_orientation)
  );

  // E Beam = Direct radiation at the array level
  // 𝐸BTI = DNI * cos(AOI)
  let eb = 0;
  if (
    (sun_altitude_angle > sun_altitude_angle_day_start ||
      sun_azimuth_angle > sun_azimuth_angle_day_start) &&
    (sun_altitude_angle > sun_altitude_angle_day_end ||
      sun_azimuth_angle < sun_azimuth_angle_day_end)
  ) {
    if (aoi / rad < 90) eb = dni * Math.cos(aoi);
  }

  // Simple Sandia Sky Diffuse Model
  let ed =
    dhi * ((1 + Math.cos(node_tilt)) / 2) +
    ghi * (((0.012 * sun_zenith - 0.04) * (1 - Math.cos(node_tilt))) / 2);

  // E Ground = irradiance on the ground
  // Albedo is the fraction of the Global Horizontal Irradiance that is reflected.
  // Urban environment 0.14 – 0.22
  let eg = ghi * albedo * ((1 - Math.cos(node_tilt)) / 2);

  const gti = eb + ed + eg;

  const power = gti * node_area * node_efficiency;
}
