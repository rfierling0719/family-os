import {google} from "googleapis";
export function googleOAuth(){return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI)}
export function googleCalendarClient(accessToken:string,refreshToken?:string){const oauth=googleOAuth();oauth.setCredentials({access_token:accessToken,refresh_token:refreshToken});return google.calendar({version:"v3",auth:oauth})}
