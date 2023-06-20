'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// let map,mapEvent;

class Workout{

    date =new Date();
    id=(Date.now() + "".slice(-10));
    clicks=0;


    constructor(coords,distance,duration){
        this.coords=coords;
        this.distance=distance;
        this.duration=duration;
    }

    _setDescription(){
        this.Description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${this.date.getMonth()} ${this.date.getDay()}`
    }

    click(){
        this.clicks++;
    }
}

class Running extends Workout{
    type="running";
    constructor(coords,distance,duration,cadence){
    super(coords,distance,duration);
    this.cadence=cadence;
    this._setDescription();

    this.calcPace();

    }

    calcPace(){
        // min/km
        this.pace=this.duration/this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type="cycling";
    constructor(coords,distance,duration,eleviationGain){
    super(coords,distance,duration);
    this.eleviationGain=eleviationGain;
    this.calcSpeed();
    this._setDescription();

    }

    calcSpeed(){
        this.speed=this.distance/(this.duration/60);
        return this.speed;
    }
}



// APPLICATION ARCHITECTURE
class App{

    // PRivate class fields
    #map;
    #mapZoomLevel=13;
    #mapEvent;
    #Workout=[];

    constructor(){
        
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();


    form.addEventListener("submit",this._newWorkOut.bind(this));
    inputType.addEventListener("change",this._toggleElevation);
    containerWorkouts.addEventListener("click",this._moveToPopUp.bind(this))

    }


    _getPosition(){
        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                alert("could not get your location")
            });
    }

    _loadMap(position){

            // console.log (position)
            const {latitude}=position.coords;
            const {longitude}=position.coords;
            // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
        
            const coords=[latitude,longitude];
            
            // console.log(this)
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
               attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
            }).addTo(this.#map);
        
        // handling clicks on map
        this.#map.on("click",this._showForm.bind(this));

        this.#Workout.forEach(work=>this._renderWorkoutMarker(work));

    }

    _showForm(mapE){
        this.#mapEvent=mapE;
        
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    _hideForm(){
        // empty the input
        inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value="";
        form.style.display="none";
        form.classList.add("hidden"); 
        setTimeout(()=>form.style.display="grid",1000);
    }

    _toggleElevation(){
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkOut(e){

        const validInputs=(...inputs)=>inputs.every(inp=>Number.isFinite(inp));
        const allPositive=(...inputs)=>inputs.every(inp=>inp>0);
        // display the marker
        e.preventDefault();

        // get data from form
        const type=inputType.value; 
        const distance=+inputDistance.value;
        const duration=+inputDuration.value;
        const {lat,lng}=this.#mapEvent.latlng;


        // if workout running , create running object 
        if(type==="running"){
            const candence=+inputCadence.value;

            // check if data is valid
            // guard class
            // if(!Number.isFinite(distance)||!Number.isFinite(duration)||!Number.isFinite(candence)) return alert("have to be positive no.")
            if(!validInputs(distance,duration,candence) || !allPositive(distance,duration,candence)) 
            return alert("have to be positive no.");

            Workout=new Running([lat,lng],distance,duration,candence);

        }

// if workout cycling , create cycling object 

            if(type==="cycling"){
                const elevation=+inputElevation.value;
                if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration)) return alert("have to be positive no.")
                Workout=new Cycling([lat,lng],distance,duration,elevation);
            }
            this.#Workout.push(Workout)
            

            // render workout on map
            this._renderWorkoutMarker(Workout);

            this._renderWorkout(Workout);
            
            // clear input fields
            this._hideForm();

            this._setLocalStorage();
     
 
    }

    _renderWorkoutMarker(Workout){  
        L.marker(Workout.coords)
        .addTo(this.#map)
         .bindPopup(L.popup({
               
             maxWidth:250,
             minWidth:150,
             autoClose:false,
             closeOnClick:false,
             className:`${Workout.type}-popup`,
         })
     )
     .setPopupContent(`${Workout.type==="running"?"🏃":"🚲"} ${Workout.Description}`)    
     .openPopup();
    }

    _renderWorkout(Workout){
        let html=`
        <li class="workout workout--${Workout.type}" data-id="${Workout.id}">
          <h2 class="workout__title">${Workout.Description}</h2>
           <div class="workout__details">
              <span class="workout__icon">${Workout.type==="running"?"🏃":"🚲"}</span>
              <span class="workout__value">${Workout.distance}</span>
              <span class="workout__unit">km</span>
          </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${Workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`

        if(Workout.type==="running")
            html+=` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👣</span>
            <span class="workout__value">178</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`

        if(Workout.type==="cycling")
            html+=`  
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${Workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
           </div>
           <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${Workout.eleviationGain}</span>
                <span class="workout__unit">m</span>
           </div>
        </li> `

        form.insertAdjacentHTML("afterend",html)
    }

    _moveToPopUp(e){
        const workoutEl=e.target.closest(".workout");
        // console.log(workoutEl);

        if(!workoutEl) return;

        const workout=this.#Workout.find(work=> work.id === workoutEl.dataset.id);
        // console.log(workout);

        this.#map.setView(workout.coords,this.#mapZoomLevel,{
            animate:true,
            pan:{
                duration:1
            }
        });

        // using the public interface
        // workout.click();

       
    }

    _setLocalStorage(){
        localStorage.setItem("workouts",JSON.stringify(this.#Workout))
    }
     
    _getLocalStorage(){
       const data= JSON.parse(localStorage.getItem("workouts"));
    //    console.log(data); 

       if(!data) return;

       this.#Workout=data; 

       this.#Workout.forEach(work=>this._renderWorkout(work));
    }

    reset(){
        localStorage.removeItem("workouts");
        location.reload();
    }
}


const app= new App();


// navigator.geolocation.getCurrentPosition(function(position){
//     console.log(position)
//     const {latitude}=position.coords;
//     const {longitude}=position.coords;
//     console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

//     const coords=[latitude,longitude];
    
//     map = L.map('map').setView(coords, 13);

//     // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png'      ===>default layout
//     L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
//     }).addTo(map);

//     // L.marker(coords)
//     // .addTo(map)
//     // .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
//     // .openPopup();

// // handling clicks on map
//     map.on("click",function(mapE){
        
//         mapEvent=mapE;

//         form.classList.remove("hidden");
//         inputDistance.focus();

//     });



//     },
//     function(){
//         alert("could not get your location")
//     });


    // form.addEventListener("submit",function(e){
    //     // display the marker
    //     e.preventDefault();


    //     // clear input fields
    //    inputDistance.value=inputDuration.value=inputCadence.value=inputElevation="";


    //     console.log(mapEvent);

    //     const {lat,lng}=mapEvent.latlng;

    //     L.marker([lat,lng])
    //        .addTo(map)
    //         .bindPopup(L.popup({
                  
    //             maxWidth:250,
    //             minWidth:150,
    //             autoClose:false,
    //             closeOnClick:false,
    //             className:"running-popup"
    //         })
    //     )
    //     .setPopupContent("workout")    
    //     .openPopup();
    // })


    // inputType.addEventListener("change",function(){
    //     inputElevation.closest(".form__row").classList.toggle("form__row--hidden")
    //     inputCadence.closest(".form__row").classList.toggle("form__row--hidden")

    // })