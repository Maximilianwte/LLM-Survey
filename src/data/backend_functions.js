import axios from "axios";
let URL_PREFIX = process.env.VUE_APP_URL_PREFIX + "/.netlify/functions";

let logic_functions = {
  async send_request(data) {
    return await axios.post(URL_PREFIX + "/data/send_openai_request", data).then(response => {
      return response
    })
  },
  async get_scenario() {
    return await axios.get(URL_PREFIX + "/data/get_open_scenario").then(response => {
      return response
    })
  },
  async send_answer(data) {
    return await axios.post(URL_PREFIX + "/data/send_answer", data).then(response => {
      return response
    })
  }
}



export default logic_functions