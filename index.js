/**
 * @format
 */

import axios from 'axios';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Never let a stalled request leave the UI on a spinner forever. All Xbox API
// calls are short-lived; a half-open connection should fail and let the user
// retry instead of hanging indefinitely.
axios.defaults.timeout = 20000;

AppRegistry.registerComponent(appName, () => App);
