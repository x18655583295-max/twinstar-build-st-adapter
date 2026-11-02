import {getContext} from '/scripts/extensions.js';
import * as openAI from '/scripts/openai.js';
import {installSillyTavern} from './runtime.js?v=0.5.3-twinstar-rpc';

installSillyTavern({getContext,openAI,owner:'legacy'});
