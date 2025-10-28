u# Trackly
## React Native App

### Overview
Trackly is a React Native mobile application that leverages a TensorFlow Lite local model to predict horse race outcomes using real-time data.
 

### AI Assistants Utilized
The development process incorporated multiple AI platforms for model building and app development:
- Google AI Studio – Mobile app development
- Google Gemini 2.5 Pro – TensorFlow model creation
- Claude Sonnet 4 – TensorFlow model creation

### Key Findings & Challenges
#### Google Gemini 2.5 Pro and Claude Sonnet 4
- Successfully generated Python scripts for data scraping, preprocessing, model training, and TensorFlow Lite conversion.
- Both assistants performed well for independent ML tasks, completing the process within 2 days.

#### Google AI Studio 
- App Build feature cannot generate Python code.
- Defaults to React Web unless explicitly instructed with a base React Native/Expo project.
- Development timeline:
  - 2 days – core app functionality
  - 1 day – model integration (manual effort due to AI limitations)
- No AI assistant could directly integrate TensorFlow Lite due to version compatibility issues.
- Impression: Feels like collaborating with a capable developer—able to connect features effectively, but occasionally rigid when handling library/versioning constraints.
 

### Project Status

- 5 days total:
  - TensorFlow model built and converted.
  - First app version deployed to Google Play (Closed Testing).
- Currently focusing on model fine-tuning and iterative updates based on user feedback.

  # Trackly
## React Native App

### Overview
Trackly is a React Native mobile application that leverages a TensorFlow Lite local model to predict horse race outcomes using real-time data.
 

### AI Assistants Utilized
The development process incorporated multiple AI platforms for model building and app development:
- Google AI Studio – Mobile app development
- Google Gemini 2.5 Pro – TensorFlow model creation
- Claude Sonnet 4 – TensorFlow model creation

### Key Findings & Challenges
#### Google Gemini 2.5 Pro and Claude Sonnet 4
- Successfully generated Python scripts for data scraping, preprocessing, model training, and TensorFlow Lite conversion.
- Both assistants performed well for independent ML tasks, completing the process within 2 days.

#### Google AI Studio 
- App Build feature cannot generate Python code.
- Defaults to React Web unless explicitly instructed with a base React Native/Expo project.
- Development timeline:
  - 2 days – core app functionality
  - 1 day – model integration (manual effort due to AI limitations)
- No AI assistant could directly integrate TensorFlow Lite due to version compatibility issues.
- Impression: Feels like collaborating with a capable developer—able to connect features effectively, but occasionally rigid when handling library/versioning constraints.
- Challenges：
  - When trying to ask AI to add a export feature to save a file to Downloads folder, AI strggule to use the wrong EXPO SDK version of coding. Even telling do not use certain type of code and providing sample code and URL for its reference (https://docs.expo.dev/versions/latest/sdk/filesystem/), it will rollback to what its beleive when I told him the code has something to fix. Fixed by,google search alternative way to save a file to Downloads (@react-native-documents/picker) and told AI to use it. And found out @react-native-documents/picker only need 1 line of code to do the task.



### Project Status

- 5 days total:
  - TensorFlow model built and converted.
  - First app version deployed to Google Play (Closed Testing).
- Currently focusing on model fine-tuning and iterative updates based on user feedback.
 

 ### Google Play
 1. Webpage
https://rcwkan.github.io 
 2. Download App: https://play.google.com/store/apps/details?id=app.rit.trackly
