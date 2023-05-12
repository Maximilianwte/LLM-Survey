<template>
  <div class="w-full flex-col mb-32">
    <div class="flex-col px-6 w-full md:w-auto items-start text-xl mt-16">
      <div id="surveyQuestion" v-if="happy_result == null" class="w-full">
        <div v-if="started_survey == false" class="">
          <h2 class="text-3xl">Survey Title</h2>
          <p class="mt-4">Task description here. Maybe add steps of what they do?</p>
          <button @click="start_survey"
              class="mt-4 bg-red-500 hover:bg-red-400 text-white shadow-md px-8 py-2 text-xl rounded-full">Start</button>
        </div>
        <div v-if="started_survey && scenario_id != null" id="contentBox">
          <h2 class="text-3xl">Survey Title</h2>
          <p class="mt-4">{{scenario[scenario_id].text}}</p>
          <div id="input" class="mt-8 flex-col w-full">
            <!-- <label class="w-full md:w-156 ml-2">Question Title:</label> -->
            <input maxlength="50" class="h-10 w-full md:w-156 py-2 px-2 text-lg bg-bg shadow-md rounded-md" type="text"
              name="title" placeholder="Enter your question title here" v-model="input.title">
            <!-- <label class="w-full md:w-156 ml-2 mt-4">Question Description:</label> -->
            <textarea maxlength="300" class="mt-4 h-40 py-2 px-2 text-lg w-full md:w-156 rounded-md bg-bg shadow-md"
              type="text" placeholder="Enter your question description here" name="description"
              v-model="input.description"></textarea>
            <p v-if="information.length > 0" class="text-xl mt-4 text-red-500">{{information}}</p>
            <button @click="send_response"
              class="mt-4 bg-red-500 hover:bg-red-400 text-white shadow-md px-8 py-2 text-xl rounded-full">Enter</button>
          </div>
        </div>
      </div>

      <div id="resultGPT" v-if="answer.received && happy_result == null" class="w-full">
        <div id="response"
          class="mt-12 h-32 border-2 border-green-500 py-2 px-2 text-lg w-full md:w-156 rounded-md bg-bg shadow-md"
          type="text">
          <p>{{answer.text}}</p>
        </div>
        <div id="labelhappyresult" class="mt-6 w-full md:w-156 flex justify-center">
          <h3>Does this answer solve your question?</h3>
        </div>
        <div id="buttonhappyresult" class="w-full md:w-156 flex justify-center">
          <button @click="set_happy(true)"
            class="mt-4 bg-gray-100 hover:bg-green-500 hover:text-white shadow-md px-8 py-2 text-xl rounded-full">Yes</button>
          <button @click="set_happy(false)"
            class="mt-4 bg-gray-100 ml-2 hover:bg-red-500 hover:text-white shadow-md px-8 py-2 text-xl rounded-full">No</button>
        </div>
      </div>

      <div v-if="happy_result" id="linkQualtrics">
        <h3>Description Link to Qualtrics</h3>
        <a></a>
      </div>
      <div v-if="happy_result == false" id="linkForum">
        <h3>Description Link to Garmin</h3>
        <a></a>
        <div v-if="time_forum_seconds > 30" id="leaveToQualtrics">
          <h3>If you finished surfing the Garmin Forum, you can now go to the survey. It's fine to close this tab after
            you clicked on the survey link.</h3>
          <a href=""></a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import backend_functions from "../data/backend_functions";
  export default {
    data() {
      return {
        scenario: [{
            id: 0,
            title: "Get Wifi",
            text: "This is a scenario text."
          },
          {
            id: 1,
            title: "Get Music",
            text: "This is a scenario text."
          },
          {
            id: 2,
            title: "Get Battery",
            text: "This is a scenario text."
          }
        ],
        input: {
          title: "",
          description: ""
        },
        answer: {
          received: false,
          text: ""
        },
        information: "",
        scenario_id: 0,
        prolific_id: null,
        study_id: null,
        session_id: null,
        time_total_seconds: 0,
        time_forum_seconds: 0,
        started_survey: false,
        happy_result: null,
      }
    },
    methods: {
      geturlparameter(id) {
        return this.$route.query[id] == null ? "" : this.$route.query[id];
      },
      send_response() {
        if (this.input.title.length > 3 && this.input.description.length > 10) {
          this.information = ""
          backend_functions.send_request(this.input).then(answer => {
            this.answer.received = true;
            this.answer.text = answer.data.text;

            let data = {
            respondent_id: this.prolific_id,
            scenario_id: this.scenario_id,
            question_title: this.input.title,
            question_description: this.input.description,
            openai_answer: this.answer.text
          }
          backend_functions.send_answer(data);
          })
        } else {
          this.information = "Please enter a question title and description.";
        }
      },
      start_survey() {
        this.started_survey = true;
      },
      set_happy(state) {
        this.happy_result = state;
        if (state == false) {
          this.increase_time_forum_seconds();
        }
      },
      increase_time_total_seconds() {
        this.time_total_seconds += 10;
        setTimeout(this.increase_time_total_seconds, 10000);
      },
      increase_time_forum_seconds() {
        this.time_forum_seconds += 10;
        setTimeout(this.increase_time_forum_seconds, 10000);
      },
    },
    mounted() {
      this.increase_time_total_seconds();
      // here set all parameters needed for prolific
      this.prolific_id = this.geturlparameter("PROLIFIC_PID");
      this.study_id = this.geturlparameter("STUDY_ID");
      this.session_id = this.geturlparameter("SESSION_ID");

      /* backend_functions.get_scenario().then(response => {
        this.scenario_id = response.scenario_id;
    }) */
    }
  }
</script>