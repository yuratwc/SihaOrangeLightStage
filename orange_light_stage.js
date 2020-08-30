/**
 * Orange Light Stage v 0.0.1
 * Programed by yuratwc <twitter: @yuratwc>
 */
(function() {

    /**
     * Load Assets
     */

    const preLoadTextures = [
        ['basicNote', './imgs/basic_note.png'],
        ['noteRight', './imgs/slide_note_right.png'],
        ['noteLeft', './imgs/slide_note_left.png'],
        ['hpBar', './imgs/hp_bar.png'],
        ['scoreBar', './imgs/score_bar.png'],
        ['musicDescription', './imgs/music_desc.png'],
        ['judgePerfect', './imgs/judge_perfect.png'],
        ['judgeGreat', './imgs/judge_great.png'],
        ['judgeNice', './imgs/judge_nice.png'],
        ['judgeBad', './imgs/judge_bad.png'],
        ['judgeMiss', './imgs/judge_miss.png'],
        ['foreground', './imgs/fg.png'],
        ['result', './imgs/result.png'],
        ['siha2d', './imgs/siha_2d.png'],
        ['background', './imgs/bg.png'],
        ['comBg', './imgs/com_bg.png'],
        ['comFg', './imgs/com_fg.png'],
    ];
    const requestUri = "http://localhost:8000/data-sender.php";
    var textures = {};
    var context;
    var isMobile = false;
    var isSafari = false;

    const CIRCLE_TIME = 360;
    var userId = "";

    for(let i = 0; i < preLoadTextures.length; i++) {
        let tex = PIXI.Texture.fromImage(preLoadTextures[i][1]);
        textures[preLoadTextures[i][0]] = tex;
    }

    function debug_output(tt) {
        //console.log(tt);
        //alert(tt);
    }

    const comTexts = ["???\nさて、今日も大学に来たぞ……","???\nもしかして新しいプロデューサーさんですか？","???\n???","???\n今日、ステージがあるんです……!\nだからその、見ていってくれると、うれしぃは。","???\nあぁっ!お名前を聞くのを忘れてました。\n何ておよびすればいいですか?"];
    debug_output('aaa');

    class Taso2Engine {
        static getBrowserId() {
            const userAgent = window.navigator.userAgent.toLowerCase();
            if(userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1)
                return 'ie';
            if(userAgent.indexOf('edge') != -1)
                return 'edge';
            if(userAgent.indexOf('chrome') != -1)
                return 'chrome';
            if(userAgent.indexOf('safari') != -1)
                return 'safari';
            if(userAgent.indexOf('opera') != -1)
                return 'opera';
            return 'firefox';
        }

        static uuid() {
            // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
            // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
            for (let i = 0, len = chars.length; i < len; i++) {
                switch (chars[i]) {
                    case "x":
                        chars[i] = Math.floor(Math.random() * 16).toString(16);
                        break;
                    case "y":
                        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                        break;
                }
            }
            return chars.join("");
        }
    }

    class Sound {
        constructor(url) {
            this.url = url;
            this.bpm = 120;
            this.currentTime = 0;
            this.ready = false;
            //this.onfinished = this.finished;
            this.isPlaying = false;
        }

        finished() {
            if(this.onfinished)
                this.onfinished();
            this.isPlaying = false;
        }

        load() {
            let request = new XMLHttpRequest();
            request.open('GET', this.url, true);
            request.responseType = 'arraybuffer';
            request.onload = (function () {
                context.decodeAudioData(request.response, (function(buffer) {
                    this.pointer = buffer;
                    this.ready = true;
                    if(this.soundLoaded)
                        this.soundLoaded();
                }).bind(this));
            }).bind(this);
            request.send();
        }

        play() {
            if(this.pointer) {
                this.source = context.createBufferSource();
                this.source.buffer = this.pointer;

                this.source.onended = (function() {
                    if(this.soundFinished)
                        this.soundFinished();
                }).bind(this);

                this.source.connect(context.destination);
                this.source.start(0);
                this.currentTime = context.currentTime;
                this.isPlaying = true;
            }
            
          }

        getCount() {
            let time = context.currentTime - this.currentTime;
            time *= 1000;
            let mr =time / (1000 * 60 / this.bpm * 4) * 960;
            return Math.floor(mr);
          }

        getBarIndex() {
            let time = context.currentTime - this.currentTime;
            let mr = 60 / this.bpm * 4; //1syousetu count
            return Math.floor( time / mr );
          }

        getPhaseIndex() {
            let time = context.currentTime - this.currentTime;
            let mr = 60 / this.bpm ; //1syousetu count
            return Math.floor( time / mr );
        }

        dispose() {
            this.pointer = null;
        }

        isLoaded() {
            return this.ready;
        }
        static initContext() {
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                context = new AudioContext();
            } catch(e) {
                alert('Failed to initialize Taso2 GameEngine');
                //TODO
            }
        }
        
        static playSilent() {
            let buf = context.createBuffer(1, 1, 22050);
            let src = context.createBufferSource();
            src.buffer = buf;
            src.connect(context.destination);
            src.start(0);
        }

        static getFormat(browser) {
            if(browser === 'safari' || browser == 'ie')
                return '.m4a';
            return '.webm';
        }
    }

    const WIDTH = 1600;
    const HEIGHT = 900;

    var renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT, {backgroundColor: 0x555555, autoResize: true});

    function initialize() {
        isSafari = navigator.userAgent.indexOf('iPhone') > 0;
        let type = "webgl";
        if(!PIXI.utils.isWebGLSupported()){
          type = "canvas";
        }
        PIXI.utils.sayHello('webgl');
        document.body.appendChild(renderer.view);
        resizeScreen();
        let stage = new PIXI.Container();
        renderer.render(stage);
    }

    function resizeScreen() {
        let canvas = renderer.view;

        let _w = window.innerWidth / WIDTH * 1.0;
        let _h = window.innerHeight / HEIGHT * 1.0;
        if(_w < _h) {
            renderer.view.style.width = window.innerWidth + 'px';
            renderer.view.style.height = HEIGHT * _w + 'px';
        } else {
            renderer.view.style.width = WIDTH * _h + 'px';
            renderer.view.style.height = window.innerHeight + 'px';
        }
    }


    class Scene extends PIXI.Container {
        constructor() {
            super();
            this.counter = 0;
            this.preLoaded = false;
        }

        init() {
        }
        update() {}
        sceneLoading() {
            this.counter = 0;
        }
        sceneLoaded() {}
        preLoad() {
            this.preLoaded = true;
        }
    }

    class Note {

        constructor(noteType, lane, judgeTime, direction = 0) {
            this.noteSprite = new PIXI.Sprite(this.getTexture(noteType, direction));
            this.noteSprite.anchor.x = this.noteSprite.anchor.y = 0.5;
            this.noteSprite.visible = false;
            this.judgeTime = judgeTime;
            this.lane = lane;
            this.noteSprite.position.x = Note.getNoteX(lane);
            this.valid = true;
            this.judged = false;
            this.length = 1;
            this.noteType = noteType;
            this.direction = direction;
        }

        getTexture(note, dir) {
            if(note == 0)
                return textures['basicNote'];
            if(dir == 0)
                return textures['noteRight'];
            return textures['noteLeft'];
        }

        update(count) {
            if(!this.noteSprite)
                return;
            const nextY = (count - this.judgeTime) * Note.getSpeed() + Note.getJudgeLine();
            if(nextY >= -120 && nextY < HEIGHT + 120) {
                this.noteSprite.visible = true;
                this.noteSprite.position.y = nextY;
            } else {

                this.noteSprite.visible = false;
            }
        }

        getNoteSprite() {
            return this.noteSprite;
        }

        isJudged() {
            return this.judged;
        }

        setJudged(value) {
            this.judged = value;
        }

        isValid() {
            return this.valid;
        }

        setValid(validate) {
            this.valid = validate;
        }

        getLane() {
            return this.lane;
        }

        getNoteType() {
            return this.noteType;
        }

        getDirection() {
            return this.direction;
        }

        getJudgeCount() {
            return this.judgeTime;
        }

        static getNoteX(index) {
            return index * ((WIDTH - 120) / 5) + (WIDTH - 120) / 10 + 60;
        }

        static getJudgeLine() {
            return HEIGHT - 160;
        }

        static getSpeed() {
            return 2;
        }
    }
    /*
    *   Scene Main Game
    * 
    */
    class SceneMainGame extends Scene {
        init() {
            this.humenLoaded = false;
            this.addChild(new PIXI.Sprite(textures['background']));

            this.scoreData = {score: 0, judges: null, combo: 0, maxCombo: 0, judgeCount: 0};


            this.loadHumen();

            this.chara = new PIXI.Sprite(textures['siha2d']);
            this.chara.anchor.x = this.chara.anchor.y = 0.5;
            this.chara.position.x = WIDTH / 2;
            this.chara.position.y = HEIGHT / 2;
            this.addChild(this.chara);

            const circle = new PIXI.Graphics();
            circle.lineStyle(4, 0xFFFFFF, 1);
            for(let i = 0; i < 5; i++) {
                circle.drawCircle(Note.getNoteX(i), Note.getJudgeLine(), 95);
            }
            this.addChild(circle);

            this.judgeSprite = new PIXI.Sprite(textures['judgePerfect']);
            this.judgeSprite.anchor.x = this.judgeSprite.anchor.y = 0.5;
            this.judgeSprite.position.x = WIDTH / 2;
            this.judgeSprite.position.y = HEIGHT / 2;
            this.judgeSprite.visible = false;
            this.judgeSprite.showingCount = 0;
            this.addChild(this.judgeSprite);
            
            /*
            this.judgeText = new PIXI.Text("PERFECT!", {fill: 0xFFFFFF, stroke: '#000', strokeThickness: 8, fontSize: 80});
            this.judgeText.anchor.x = this.judgeText.anchor.y = 0.5;
            this.judgeText.position.x = WIDTH / 2;
            this.judgeText.position.y = HEIGHT / 2;
            this.judgeText.visible = false;
            this.judgeText.showingCount = 0;
            this.addChild(this.judgeText);
*/

            this.notes = [];
            this.noteContainer = new PIXI.Container();
            this.addChild(this.noteContainer);

            this.hpBar = new PIXI.Sprite(textures['hpBar']);
            this.hpBar.position.x = 182;
            this.hpBar.position.y = 16;
            this.hpBar.scale.y = 2;
            this.hpBar.scale.x = 19;
            this.addChild(this.hpBar);
            
            this.scoreBar = new PIXI.Sprite(textures['scoreBar']);
            this.scoreBar.position.x = 532;
            this.scoreBar.position.y = 16;
            this.scoreBar.scale.y = 2;
            this.scoreBar.scale.x = 51;
            this.addChild(this.scoreBar);

            this.addChild(new PIXI.Sprite(textures['foreground']));

            this.comboCountText = new PIXI.Text('0', {fill: '#FFF', stroke: '#FF8D32', strokeThickness: 6, fontSize: 120});
            this.comboCountText.anchor.x = this.comboCountText.anchor.y = 0.5;
            this.comboCountText.position.x = 1300;
            this.comboCountText.position.y = 200;
            this.comboCountText.showingCount = 0;
            this.comboCountText.visible = false;
            this.addChild(this.comboCountText);

            this.scoreText = new PIXI.Text('00000000', {fill: '#F11', stroke: '#FFF', strokeThickness: 6, fontSize: 40});
            this.scoreText.anchor.x = this.scoreText.anchor.y = 1;
            this.scoreText.position.x = 800;
            this.scoreText.position.y = 70;
            this.addChild(this.scoreText);
            
            this.transition = new PIXI.Graphics();
            this.transition.beginFill(0x0, 0.5);
            this.transition.drawRect(0, 0, WIDTH, HEIGHT);
            this.transition.endFill();
            this.addChild(this.transition);
            
            this.countTxt = new PIXI.Text("Now Loading...", {fill: 0xFFFFFF, stroke: '#000', strokeThickness: 4, fontSize:75});
            this.countTxt.anchor.x = this.countTxt.anchor.y = 1;
            this.countTxt.position.x = WIDTH - 8;
            this.countTxt.position.y = HEIGHT - 8;
            this.addChild(this.countTxt);

            this.musicDescription = new PIXI.Sprite(textures['musicDescription']);
            this.musicDescription.anchor.x = this.musicDescription.anchor.y = 0.5;
            this.musicDescription.position.x = WIDTH / 2;
            this.musicDescription.position.y = HEIGHT / 2;
            this.musicDescription.scale.x = this.musicDescription.scale.y = 2;
            this.addChild(this.musicDescription);

        
            this.interactive  = true;
            this.on('pointerdown', this.onTouchDown.bind(this));
            this.on('pointerup', this.onTouchUp.bind(this));
            this.on('pointermove', this.onTouchMove.bind(this));
            
            
            this.soundLoadStart = false;
            debug_output('end constructor');
            
            //this.pointerdown = this.onTouchDown;
            //this.on('touchstart', this.onTouchDown);
        }

        preLoad() {
            context.resume();
            const fn0 = "./fairy_";
            const fn3 = "orange_short";
            this.sound = new Sound(fn0 + fn3 + Sound.getFormat(Taso2Engine.getBrowserId()));
            this.sound.bpm = 146;
            this.sound.soundLoaded = (function() {
                this.countTxt.visible = false;
            }).bind(this);
            this.sound.soundFinished = (function() {
                Game.sceneChange(new SceneResult(this.scoreData));
            }).bind(this);

            this.gameStart = false;
            this.sound.load();
            this.soundLoadStart = true;
            Sound.playSilent();
            this.preLoaded = true;
        }

        loadHumen() {
            debug_output('humenLoad');
            const req = new XMLHttpRequest();
            req.open('GET', './humen.json', true);
            req.responseType = 'json';
            req.onload = (function () {
                //console.log(req.response);

                for(let i = 0; i < req.response.notes.length; i++) {
                    const n = req.response.notes[i];
                    let note = new Note(n.n, n.x, n.y, n.d);
                    this.notes.push(note);
                    this.noteContainer.addChild(note.getNoteSprite());
                }

                this.scoreData.judges = new Array(this.notes.length);
                this.humenLoaded = true;
            }).bind(this);
            req.send();
        }

        judgeNote(sa, scale = 1) {
            if(scale == undefined || scale == null)
                scale = 1;
            
            if(sa < (16 * scale))
                return {text:'PERFECT!', id: 3, texture:textures['judgePerfect']};
            if(sa < (32 * scale))
                return {text:'GREAT!', id: 2, texture:textures['judgeGreat']};
            if(sa < (64 * scale))
                return {text:'NICE!', id: 1, texture:textures['judgeNice']};
            if(sa < (128 * scale))
                return {text:'BAD!', id: 0, texture:textures['judgeBad']};
            return {text:'MISS!', id: -1, texture:textures['judgeMiss']};
        }

        onTouchDown(evt) {
            if(!this.gameStart) {
                this.gameStart = this.sound.isLoaded();
                if(this.gameStart) {
                    debug_output('begin play');
                    
                    this.sound.play();
                    this.musicDescription.visible = false;
                }
            }
            const laneIndex = this.getTouchedIndex(evt.data.global.x);
            const nearestNote = this.getNearestNote(laneIndex);
            if(nearestNote && nearestNote.getNoteType() == 0) {
                const m = this.sound.getCount() - nearestNote.getJudgeCount();
                const uma = this.judgeNote(Math.abs(m));

                this.increaseScore(uma.id);
                this.judgeSprite.texture = uma.texture;
                this.judgeSprite.visible = true;
                this.judgeSprite.showingCount = 30;
                this.noteContainer.removeChild(nearestNote.getNoteSprite());
                nearestNote.setJudged(true);
                nearestNote.setValid(false);
            }
            this.touching = true;
            this.beforeX = evt.data.global.x;
        }

        onTouchUp(evt) {
            this.touching = false;
        }

        onTouchMove(evt) {
            if(this.touching) {
                const vx = evt.data.global.x - this.beforeX;
                if(Math.abs(vx) > 0.7) {
                    const laneIndex = this.getTouchedIndex(evt.data.global.x);
                    const nearestNote = this.getNearestNote(laneIndex);
                    if(nearestNote && nearestNote.getNoteType() == 2) {
                        //console.log(nearestNote.getDirection() + 'a' + vx);
                        if((vx < 0 && nearestNote.getDirection() == 2) || (vx > 0 && nearestNote.getDirection() == 0)) {
                            const m = this.sound.getCount() - nearestNote.getJudgeCount();
                            const uma = this.judgeNote(Math.abs(m), 2);
                            this.judgeSprite.text = uma.texture;
                            this.judgeSprite.visible = true;
                            this.judgeSprite.showingCount = 40;
                            this.increaseScore(uma.id);
                            this.noteContainer.removeChild(nearestNote.getNoteSprite());
                            nearestNote.setJudged(true);
                            nearestNote.setValid(false);
                        }
                        /*
                        if(vx < 0 && nearestNote.getDirection() == 1) {
                            //left flick

                        } else if(vx > 0 && nearestNote.getDirection() == 0) {
                            //right flick
                        }
*/
                    }
                }
            }
            this.beforeX = evt.data.global.x;
        }
        
        increaseScore(judge) {
            this.scoreData.judges[this.scoreData.judgeCount++] = judge + 1;
            if(judge <= 0) {
                this.scoreData.combo = 0;
            } else {
                this.scoreData.maxCombo = ++this.scoreData.combo;
            }
            this.scoreData.score += this.scoreData.combo * 10 + 100 * (judge + 1);
            if(this.scoreData.combo > 0) {
                this.comboCountText.text = this.scoreData.combo;
                this.comboCountText.showingCount = 60;
                this.comboCountText.visible = true;
            } else {
                this.comboCountText.visible = false;
                this.comboCountText.alpha = 1;
            }
            this.scoreBar.scale.x = Math.min(51, this.scoreData.score / 1000000 * 51);
            this.scoreText.text = ('00000000' + this.scoreData.score).slice(-8);
        }

        getTouchedIndex(x) {
            const p = ((WIDTH - 120) / 5);
            return Math.min(4, Math.floor((x - 60) / p));
        }

        getNearestNote(laneIndex) {
            let minIndex = -1;
            let minValue = 99999999;
            const len = this.notes.length;
            for(let i = 0; i < len; i++) {
                const note = this.notes[i];
                if(!note.isValid() || note.getLane() != laneIndex)
                    continue;
                const sa = this.sound.getCount() - note.getJudgeCount();
                const saAbs = Math.abs(sa);
                if(saAbs <= 240 && saAbs <= minValue ) {
                    minValue = saAbs;
                    minIndex = i;
                }
            }
            return minIndex >= 0 ? this.notes[minIndex] : null;
        }

        update() {
            if(!this.gameStart || !this.humenLoaded)
                return;
            if(this.transition.visible) {
                this.transition.alpha -= 0.1;
                if(this.transition.alpha <= 0) {
                    this.transition.visible = false;
                    this.transition.alpha = 1;
                }
            }

            this.judgeSprite.showingCount -= 1;
            if(this.judgeSprite.showingCount == 0) {
                this.judgeSprite.visible = false;
            }

            this.comboCountText.showingCount -= 1;
            this.comboCountText.alpha = Math.min(10, this.comboCountText.showingCount) / 10;
            if(this.comboCountText.showingCount == 0) {
                this.comboCountText.visible = false;
                this.comboCountText.alpha = 1;
            }
            
            this.chara.scale.x = ((this.sound.getBarIndex() % 2) == 0) ? 1 : -1;
            //this.countTxt.text = this.sound.getCount() + '\r\n(' + this.sound.getBarIndex() + ',' + (this.sound.getPhaseIndex() % 4)+ ')';
            const curCount = this.sound.getCount();
            const len = this.notes.length;
            for(let i = 0; i < len; i++) {
                if(!this.notes[i].isJudged()) {
                    const sa = curCount -  this.notes[i].getJudgeCount();
                    if(sa > 128) {
                        const uma = this.judgeNote(130, 1);
                        this.judgeSprite.texture = uma.texture;
                        this.judgeSprite.visible = true;
                        this.judgeSprite.showingCount = 40;
                        this.increaseScore(uma.id);
                        this.noteContainer.removeChild(this.notes[i].getNoteSprite());
                        this.notes[i].setJudged(true);
                        this.notes[i].setValid(false);
                    }
                }
                if(this.notes[i].isValid())
                    this.notes[i].update(curCount);
            }
        }

    }

    class SceneResult extends Scene {
        constructor(scoreObj) {
            super();
            this.scoreData = scoreObj;
        }

        init() {
            this.addChild(new PIXI.Sprite(textures['result']));
            this.addChild(this.createText('PERFECT', 0, 0));
            this.addChild(this.createText('GREAT', 1, 0));
            this.addChild(this.createText('NICE', 2, 0));
            this.addChild(this.createText('BAD', 3, 0));
            this.addChild(this.createText('MISS', 4, 0));
            this.addChild(this.createText('COMBO', 5.8, 0));
            this.addChild(this.createText('SCORE', 8.5, 0));
            
            let counts = [0, 0, 0, 0, 0];
            for(let i = 0; i < this.scoreData.judges.length; i++) {
                counts[this.scoreData.judges[i]]++;
            }

            this.addChild(this.createText(counts[4] + '', 0, 1));
            this.addChild(this.createText(counts[3] + '', 1, 1));
            this.addChild(this.createText(counts[2] + '', 2, 1));
            this.addChild(this.createText(counts[1] + '', 3, 1));
            this.addChild(this.createText(counts[0] + '', 4, 1));
            this.addChild(this.createText(this.scoreData.maxCombo, 5.8, 1));
            this.addChild(this.createText(this.scoreData.score, 8.5, 1));
            
        }

        createText(str, line, right) {
            const txt = new PIXI.Text(str, {fill: 0x0, fontSize: 38});
            txt.anchor.x = right * 1;
            txt.anchor.y = 1;
            txt.position.x = right * 548 + 77;
            txt.position.y = line * 48 + 327;
            return txt;
        }
        update() {

        }

        j() {
            const xorConst = Math.floor(Math.random() * 254) + 1;

            let counts = [0, 0, 0, 0, 0];
            for(let i = 0; i < this.scoreData.judges.length; i++) {
                counts[this.scoreData.judges[i]]++;
            }

            const date = new Date();
            const unixtime = Math.floor( date.getTime() / 1000 );

            const mJson = {p:counts[4],g:counts[3],n:counts[2],b:counts[1],m:counts[0],s:this.scoreData.score,c:this.scoreData.maxCombo,u:userId,t:unixtime};
            let jsonStr = JSON.stringify(mJson);
            const resultArray = [12, xorConst];
            for(let i = 0; i < jsonStr.length; i++) {
                const c = jsonStr.charCodeAt(i);
                const d = c ^ xorConst;
                resultArray.push(d);
            }
            resultArray.push(jsonStr.length);
            resultArray.push(resultArray.length);

            let resultStr = "";
            for(let i = 0; i < resultArray.length; i++) {
                resultStr += ('00' + resultArray[i].toString(16)).slice(-2);
            }
            return resultStr;
        }

        preLoad() {
            //send to the server
            const t = this.j();
            //console.log(t);
            //const b = window.btoa(this.username);  //username
            const req = new XMLHttpRequest();
            req.open('POST', requestUri + '?a=p&c=1&b=' + t);
            //req.send();
            req.onload = (function (evt) {

            });
            this.preLoaded = true;
        }
    }

    class SceneIntro extends Scene {
        
        init(){
            this.addChild(new PIXI.Sprite(textures['comBg']));
            this.addChild(new PIXI.Sprite(textures['comFg']));
            this.displayText = new PIXI.Text("", {fill: 0x0, fontSize:45});
            this.displayText.x = 190;
            this.displayText.y = 650;
            this.addChild(this.displayText);

            this.interactive = true;
            this.on('pointerdown', this.onTouchDown.bind(this));
            this.currentText = comTexts[0];
            this.charaDelay = 0;
            this.currentStrIndex = 0;
            this.canSkip = false;
            this.textIndex = 0;
            this.touched = false;
        }

        update() {
            this.charaDelay++;
            if(this.charaDelay == 3)
            {
                this.currentStrIndex++;
                this.currentStrIndex = Math.min(this.currentStrIndex, this.currentText.length);
                this.displayText.text = this.currentText.substr(0, this.currentStrIndex);
                this.charaDelay = 0;
                this.canSkip = (this.currentText.length == this.currentStrIndex);
            }
        }

        onTouchDown(evt) {
            if(this.canSkip) {
                if(this.textIndex == comTexts.length - 1 && !this.touched) {
                    let aUserName = "";
                    for(;;) {
                        aUserName = window.prompt("お名前はなんですか？");
                        if(aUserName.length > 0)
                            break;
                    }
                    if(aUserName.length > 0) {
                        const req = new XMLHttpRequest();
                        req.open('POST', requestUri + '?a=u&b=' + window.btoa(unescape(encodeURIComponent(aUserName))) + "&c=" + userId);
                        req.send();
                        //req.onload = (function (evt) {
            
                        //});
                        Game.sceneChange(new SceneMainGame());
                        this.touched = true;
                    }
                    return;
                }
                this.displayText.text = "";
                this.currentText = comTexts[++this.textIndex];
                this.charaDelay = 0;
                this.canSkip = false;
                this.currentStrIndex = 0;
            } else {
                //this.currentStrIndex = this.currentText.length;
                //this.displayText.text = this.currentText.substr(0, this.currentStrIndex);
                //this.charaDelay = 0;
            }
        }

    }


    class SceneTitle extends Scene {
        init(){
            this.addChild(new PIXI.Sprite(textures['comBg']));

            const lsgUsedId = localStorage.getItem('userid');
            this.isGoneCom = false;
            if(lsgUsedId) {
                userId = lsgUsedId;
            } else {
                userId = Taso2Engine.uuid();
                localStorage.setItem('userid', userId);
                const iUserName =  "";
                this.isGoneCom = true;
            }
            this.touched = false;
            this.interactive = true;
            this.on('pointerdown', this.onTouchDown.bind(this));
            //this.on('pointerup', this.onTouchUp.bind(this));
            //this.on('pointermove', this.onTouchMove.bind(this));
        }

        onTouchDown(evt) {
            if(this.touched) {
                return;
            }
            this.touched = true;
            
            if(this.isGoneCom) {
                Game.sceneChange(new SceneIntro());
            } else {
                Game.sceneChange(new SceneMainGame());
            }
        }

        update() {

        }


    }



    window.onload = (function() {
        Sound.initContext();
        Game.main();
    });

    var currentScene;
    var sceneContainer;
    var transition = {counter: 0, enable: false, next: null, nextContainer: null, points: 0, pointCounter: 0};
    class Game {
        static main() {
            window.onresize = resizeScreen;
            initialize();
            let darkScreen = new PIXI.Graphics();
            darkScreen.beginFill(0x0, 1);
            darkScreen.drawRect(0, 0, WIDTH, HEIGHT);
            darkScreen.alpha = 0;
            currentScene = new SceneTitle();
            //currentScene = new SceneMainGame();
            
            //currentScene = new SceneResult({score: 0, judges: new Array(0), combo: 0, maxCombo: 0});
            sceneContainer = new PIXI.Container();
            sceneContainer.addChild(currentScene);
            sceneContainer.addChild(darkScreen);

            let loadingText = new PIXI.Text("Now Loading...", {fill: 0xFFFFFF, fontSize:80});
            loadingText.anchor.x = 0;
            loadingText.anchor.y = 1;
            loadingText.position.x = WIDTH / 2;
            loadingText.position.y = HEIGHT - 10;



            currentScene.init();
    
            function animateUpdate() {
                requestAnimationFrame(animateUpdate);
                currentScene.update();

                if(transition.enable) {
                    //darkScreen.alpha = 1;
                    transition.pointCounter++;
                    if(loadingText.visible && transition.pointCounter % 20 == 0) {
                        transition.points++;
                        transition.points %= 4;
                        let txtp = "";
                        for(let i = 0; i < transition.points; i++)
                            txtp += ".";
                        loadingText.text = ("Now Loading" + txtp);
                    }
                    if(transition.counter <= 30) {
                        transition.counter++;
                        darkScreen.alpha = (transition.counter / 30);
                    } else {
                        if(!transition.moved) {
                            currentScene = transition.next;
                            sceneContainer = transition.nextContainer;
                            sceneContainer.addChild(darkScreen);
                            sceneContainer.addChild(loadingText);
                            
                            currentScene.preLoad();
                            transition.moved = true;
                            loadingText.visible = true;
                            
                        } else if(currentScene.preLoaded && !transition.loaded) {
                            currentScene.init();
                            transition.loaded = true;
                            loadingText.visible = false;
                        } else if(transition.loaded) {
                            transition.counter++;
                        }
                        darkScreen.alpha = 1 - ((transition.counter - 30) / 30);
                    }
                }
                renderer.render(sceneContainer);
            }
            requestAnimationFrame(animateUpdate);
        }

        static sceneChange(scene) {
            transition.nextContainer = new PIXI.Container();
            scene.init();
            transition.next = scene;
            transition.moved = false;
            transition.nextContainer.addChild(scene);
            transition.counter = 0;
            transition.loaded = false;
            transition.enable = true;
        }
    
    }
})();

