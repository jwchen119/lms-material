/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const ARTIST_TAB = 0;
const ALBUM_TAB = 1;
const TRACK_TAB = 2;

const NP_FONT_ACT = 0;
const NP_PIC_ACT = 1;
const NP_INFO_ACT = 2;
const NP_BROWSE_CMD = 3;
const NP_COPY_DETAILS_CMD = 4;
const NP_CUSTOM = 100;
const NP_ITEM_ACT = 200;

var currentPlayingTrackPosition = 0;

var lmsNowPlaying = Vue.component("lms-now-playing", {
    template: `
<div>
 <svg style="visibility:hidden;z-index:1000;position:fixed" width="0" height="0">
  <defs>
   <filter id="filter-radius">
    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 100 -50" result="mask"/>
    <feComposite in="SourceGraphic" in2="mask" operator="atop"/>
    <feDropShadow dx="2" dy="2" stdDeviation="8" flood-opacity="0.5"/>
   </filter>
   <filter id="filter-radius-plain">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 100 -50" result="mask"/>
    <feComposite in="SourceGraphic" in2="mask" operator="atop"/>
   </filter>
  </defs>
 </svg>

 <div v-show="!desktopLayout || info.show || largeView" class="np-bgnd">
  <div v-show="info.show ? drawInfoBgndImage : drawBgndImage" class="np-bgnd bgnd-cover" id="np-bgnd">
   <div v-bind:class="{'np-bgnd bgnd-blur':(info.show ? drawInfoBgndImage : drawBgndImage)}"></div>
  </div>
 </div>

 <v-tooltip top :position-x="timeTooltip.x" :position-y="timeTooltip.y" v-model="timeTooltip.show">{{timeTooltip.text}}</v-tooltip>
 <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y" absolute offset-y>
  <v-list>
   <template v-for="(item, index) in menu.items">
    <v-list-tile @click="menuAction(item)">
     <v-list-tile-avatar v-if="menu.icons" :tile="true" class="lms-avatar"><v-icon v-if="item.icon">{{item.icon}}</v-icon><img v-else-if="item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
 
 <div v-if="desktopLayout && !largeView" class="np-bar" id="np-bar" v-bind:class="{'np-desktop-sb':stopButton}">
  <v-layout row class="np-controls-desktop" v-if="stopButton">
   <v-flex xs3>
    <v-btn flat icon v-bind:class="{'disabled':disablePrev}" v-longpress:repeat="prevButton" :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn>
   </v-flex>
   <v-flex xs3>
    <v-btn flat icon v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseA" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon large class="media-icon">{{playerStatus.isplaying ? 'pause' : 'play_arrow'}}</v-icon></v-btn>
   </v-flex>
   <v-flex xs3>
    <v-btn flat icon @click="doAction(['stop'])" :title="trans.stop" v-bind:class="{'disabled':disableBtns}"><v-icon large class="media-icon">stop</v-icon></v-btn>
   </v-flex>
   <v-flex xs3>
    <v-btn flat icon v-bind:class="{'disabled':disableNext}" v-longpress:repeat="nextButton"  :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn>
   </v-flex>
  </v-layout>
  <v-layout row class="np-controls-desktop" v-else>
   <v-flex xs4>
    <v-btn flat icon v-bind:class="{'disabled':disablePrev}" v-longpress:repeat="prevButton" class="np-std-button"  :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn>
   </v-flex>
   <v-flex xs4>
    <v-btn flat icon v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseB" class="np-playpause" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon x-large class="media-icon">{{ playerStatus.isplaying ? 'pause_circle_outline' : 'play_circle_outline'}}</v-icon></v-btn>
   </v-flex>
   <v-flex xs4>
    <v-btn flat icon v-bind:class="{'disabled':disableNext}" v-longpress:repeat="nextButton" class="np-std-button"  :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn>
   </v-flex>
  </v-layout>
  <img v-if="!largeView && !disableBtns" :key="coverUrl" v-lazy="coverUrl" onerror="this.src='html/images/cover.png'" class="np-image-desktop" v-bind:class="{'np-trans':transCvr}" @contextmenu="showMenu" @click="clickImage(event)"></img>
  <v-list two-line subheader class="np-details-desktop" v-if="playerStatus.playlist.count>0">
   <v-list-tile style>
    <v-list-tile-content>
     <v-list-tile-title v-if="playerStatus.current.title">{{title}}</v-list-tile-title>
     <v-list-tile-sub-title v-if="playerStatus.current.artistAndComposer && playerStatus.current.albumLine"><object v-html="playerStatus.current.artistAndComposer"/>{{SEPARATOR}}<object v-html="playerStatus.current.albumLine"/></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.artistAndComposer" v-html="playerStatus.current.artistAndComposer"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.albumLine" v-html="playerStatus.current.albumLine"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.title">&#x22ef;</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action>
     <div v-if="playerStatus.playlist.count<2 || !(npBarRatings && !techInfo)" class="np-time-desktop" v-bind:class="{'link-item-ct':coloredToolbars,'link-item':!coloredToolbars,'np-time-desktop-r': techInfo && npBarRatings}" @click="toggleTime()">{{formattedTime}}</div>
     <div v-else class="np-time-desktop " v-bind:class="{'np-time-desktop-r': techInfo && npBarRatings, 'link-item-ct':coloredToolbars,'link-item':!coloredToolbars}" @click="toggleTime()">{{formattedTime}}{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count, SEPARATOR)}}</div>
     <div v-if="techInfo" class="np-tech-desktop ellipsis" v-bind:class="{'np-tech-desktop-r': npBarRatings}">{{technicalInfo}}</div>
     <div v-else-if="playerStatus.playlist.count>1 && !npBarRatings" class="np-tech-desktop">{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count)}}</div>
     <div v-else-if="!npBarRatings" class="np-tech-desktop">&nbsp;</div>
     <div v-if="npBarRatings && (repAltBtn.show || shuffAltBtn.show)" class="np-rating-desktop np-thumbs-desktop"><v-btn v-if="repAltBtn.show" :title="repAltBtn.tooltip" flat icon v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon v-if="repAltBtn.icon" class="media-icon">{{repAltBtn.icon}}</v-icon><img v-else :src="repAltBtn.image" class="btn-img"></img></v-btn><v-btn v-if="shuffAltBtn.show" :title="shuffAltBtn.tooltip" flat icon @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton}"><v-icon v-if="shuffAltBtn.icon" class="media-icon">{{shuffAltBtn.icon}}</v-icon><img v-else :src="shuffAltBtn.image" class="btn-img"></img></v-btn></div>
     <v-rating v-else-if="showRatings" class="np-rating-desktop" v-bind:class="{'np-rating-desktop-t':techInfo}" v-model="rating.value" half-increments hover clearable @click.native="setRating(true)" :readonly="undefined==ratingsPlugin"></v-rating>
    </v-list-tile-action>
   </v-list-tile>
  </v-list>
  <v-progress-linear height="5" id="pos-slider" v-if="playerStatus.current.duration>0" class="np-slider np-slider-desktop" :value="playerStatus.current.pospc" v-on:click="sliderChanged($event, false)" @mouseover="showTimeTooltip" @mouseout="hideTimeTooltip" @mousemove="moveTimeTooltip" @touchstart.passive="touchSliderStart" @touchend.passive="touchSliderEnd" @touchmove.passive="moveTimeTooltipTouch"></v-progress-linear>

  <div v-if="info.show" class="np-info np-info-desktop" id="np-info">
   <v-tabs centered v-model="info.tab" v-if="info.showTabs" style="np-info-tab-cover">
    <template v-for="(tab, index) in info.tabs">
     <v-tab :key="index" @contextmenu.prevent="showContextMenu">{{tab.title}}</v-tab>
     <v-tab-item :key="index" transition="" reverse-transition=""> <!-- background image causes glitches with transitions -->
      <v-card flat class="np-info-card-cover fade-both">
       <v-card-text :class="['np-info-text-desktop', zoomInfoClass, TRACK_TAB==index || tab.isMsg ? 'np-info-lyrics' : '', ALBUM_TAB==index ? 'np-info-review' : '']">
        <div v-html="tab.text"></div>
        <img v-if="undefined!=tab.image" :src="tab.image" loading="lazy" class="np-no-meta-img"></img>
        <template v-for="(sect, sindex) in tab.sections">
         <div class="np-sect-title" v-if="(undefined!=sect.items && sect.items.length>=sect.min) || undefined!=sect.html">{{sect.title}}<v-btn flat icon class="np-sect-toggle" v-if="undefined!=sect.grid" @click="toggleGrid(index, sindex)"><v-icon>{{ACTIONS[sect.grid ? USE_LIST_ACTION : USE_GRID_ACTION].icon}}</v-icon></v-btn></div>
         <v-list v-if="undefined!=sect.items && !sect.grid && sect.items.length>=sect.min" class="lms-list">
          <template v-for="(item, iindex) in sect.items">
           <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
            <v-list-tile-avatar v-if="item.image" :tile="true" class="lms-avatar">
             <img :key="item.image" v-lazy="item.image"></img>
            </v-list-tile-avatar>
            <v-list-tile-content>
             <v-list-tile-title v-if="ALBUM_TAB==index" v-html="item.title"></v-list-tile-title>
             <v-list-tile-title v-else>{{item.title}}</v-list-tile-title>
             <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
            </v-list-tile-content>
            <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
             <img :src="item.emblem | emblem()" loading="lazy"></img>
            </div>
           </v-list-tile>
          </template>
          <v-list-tile v-if="undefined!=sect.more" @click="moreClicked(index, sindex)"><v-list-tile-content><v-list-tile-title>{{sect.more}}</v-list-tile-title></v-list-tile-content></v-list-tile>
         </v-list>
         <div class="np-grid-sect" v-else-if="undefined!=sect.items && sect.grid && sect.items.length>=sect.min">
          <template v-for="(item, iindex) in sect.items">
           <div class="np-grid-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index}" @click.stop="itemClicked(index, sindex, iindex, $event)">
            <img :key="item.image" v-lazy="item.image"></img>
            <v-list-tile-title>{{item.title}}</v-list-tile-title>
            <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
            <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
             <img :src="item.emblem | emblem()" loading="lazy"></img>
            </div>
           </div>
          </template>
          <div v-if="undefined!=sect.more && undefined!=sect.items && sect.grid && sect.items.length>=sect.min" class="np-grid-more link-item" @click="moreClicked(index, sindex)">{{sect.more}}</div>
         </div>
         <div v-else-if="undefined!=sect.html" v-html="sect.html"></div>
        </template>
        <div class="np-spacer"></div>
       </v-card-text>
      </v-card>
     </v-tab-item>
    </template>
   </v-tabs>
   <div v-else>
    <v-layout row>
     <template v-for="(tab, index) in info.tabs">
      <v-flex xs4>
       <v-card flat class="np-info-card-cover">
        <v-card-title @contextmenu.prevent="showContextMenu"><p>{{tab.title}}</p></v-card-title>
        <v-card-text :class="['np-info-text-full-desktop', 'fade-both', zoomInfoClass, TRACK_TAB==index || tab.isMsg ? 'np-info-lyrics' : '', ALBUM_TAB==index ? 'np-info-review' : '']">
         <div v-html="tab.text"></div>
         <img v-if="undefined!=tab.image" :src="tab.image" loading="lazy" class="np-no-meta-img"></img>
         <template v-for="(sect, sindex) in tab.sections">
          <div class="np-sect-title" v-if="(undefined!=sect.items && sect.items.length>=sect.min) || undefined!=sect.html">{{sect.title}}<v-btn flat icon class="np-sect-toggle" v-if="undefined!=sect.grid" @click="toggleGrid(index, sindex)"><v-icon>{{ACTIONS[sect.grid ? USE_LIST_ACTION : USE_GRID_ACTION].icon}}</v-icon></v-btn></div>
          <v-list v-if="undefined!=sect.items && !sect.grid && sect.items.length>=sect.min" class="lms-list">
           <template v-for="(item, iindex) in sect.items">
            <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
             <v-list-tile-avatar v-if="item.image" :tile="true" class="lms-avatar">
              <img :key="item.image" v-lazy="item.image"></img>
             </v-list-tile-avatar>
             <v-list-tile-content>
              <v-list-tile-title v-if="ALBUM_TAB==index" v-html="item.title"></v-list-tile-title>
              <v-list-tile-title v-else>{{item.title}}</v-list-tile-title>
              <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
             </v-list-tile-content>
             <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
              <img :src="item.emblem | emblem()" loading="lazy"></img>
             </div>
            </v-list-tile>
           </template>
           <v-list-tile v-if="undefined!=sect.more" @click="moreClicked(index, sindex)"><v-list-tile-content><v-list-tile-title>{{sect.more}}</v-list-tile-title></v-list-tile-content></v-list-tile>
          </v-list>
          <div class="np-grid-sect" v-else-if="undefined!=sect.items && sect.grid && sect.items.length>=sect.min">
           <template v-for="(item, iindex) in sect.items">
            <div class="np-grid-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
             <img :key="item.image" v-lazy="item.image"></img>
             <v-list-tile-title>{{item.title}}</v-list-tile-title>
             <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
             <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
              <img :src="item.emblem | emblem()" loading="lazy"></img>
             </div>
            </div>
           </template>
           <div v-if="undefined!=sect.more && undefined!=sect.items && sect.grid && sect.items.length>=sect.min" class="np-grid-more link-item" @click="moreClicked(index, sindex)">{{sect.more}}</div>
          </div>
          <div v-else-if="undefined!=sect.html" v-html="sect.html"></div>
         </template>
         <div class="np-spacer"></div>
        </v-card-text>
       </v-card>
      </v-flex>
     </template>
    </v-layout>
   </div>
   <v-card class="np-info-card-cover">
    <v-card-actions>
     <v-spacer></v-spacer>
     <v-btn flat icon v-if="info.showTabs" @click="info.showTabs=false" :title="trans.expand"><v-icon style="margin-right:-18px">chevron_right</v-icon><v-icon style="margin-left:-18px">chevron_left</v-icon></v-btn>
     <v-btn flat icon v-else @click="info.showTabs=true" :title="trans.collapse"><v-icon style="margin-right:-18px">chevron_left</v-icon><v-icon style="margin-left:-18px">chevron_right</v-icon></v-btn>
     <div style="width:32px"></div>
     <v-btn flat icon v-if="info.sync" @click="info.sync = false" :title="trans.sync"><v-icon>link</v-icon></v-btn>
     <v-btn flat icon v-else @click="info.sync = true" :title="trans.unsync"><v-icon class="dimmed">link_off</v-icon></v-btn>
     <div style="width:32px"></div>
     <v-btn flat icon @click="trackInfo()" :title="trans.more"><img class="svg-img" :src="'more' | svgIcon(darkUi)"></img></v-btn>
     <v-spacer></v-spacer>
    </v-card-actions>
   </v-card>
  </div>
 </div>
 
 <div class="np-page" v-else id="np-page">
  <div v-if="info.show" class="np-info" id="np-info">
   <v-tabs centered v-model="info.tab" class="np-info-tab-cover">
    <template v-for="(tab, index) in info.tabs">
     <v-tab :key="index" @contextmenu.prevent="showContextMenu">{{tab.title}}</v-tab>
     <v-tab-item :key="index" transition="" reverse-transition=""> <!-- background image causes glitches with transitions -->
      <v-card flat class="np-info-card-cover fade-both">
       <v-card-text :class="['np-info-text', zoomInfoClass, TRACK_TAB==index || tab.isMsg ? 'np-info-lyrics' : '', ALBUM_TAB==index ? 'np-info-review' : '', ALBUM_TAB==index ? 'np-info-review' : '']">
        <div v-html="tab.text"></div>
        <img v-if="undefined!=tab.image" :src="tab.image" loading="lazy" class="np-no-meta-img"></img>
        <template v-for="(sect, sindex) in tab.sections">
         <div class="np-sect-title" v-if="(undefined!=sect.items && sect.items.length>=sect.min) || undefined!=sect.html">{{sect.title}}<v-btn flat icon class="np-sect-toggle" v-if="undefined!=sect.grid" @click="toggleGrid(index, sindex)"><v-icon>{{ACTIONS[sect.grid ? USE_LIST_ACTION : USE_GRID_ACTION].icon}}</v-icon></v-btn></div>
         <v-list v-if="undefined!=sect.items && !sect.grid && sect.items.length>=sect.min" class="lms-list">
          <template v-for="(item, iindex) in sect.items">
           <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
            <v-list-tile-avatar v-if="item.image" :tile="true" class="lms-avatar">
             <img :key="item.image" v-lazy="item.image"></img>
            </v-list-tile-avatar>
            <v-list-tile-content>
             <v-list-tile-title v-if="ALBUM_TAB==index" v-html="item.title"></v-list-tile-title>
             <v-list-tile-title v-else>{{item.title}}</v-list-tile-title>
             <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
            </v-list-tile-content>
            <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
             <img :src="item.emblem | emblem()" loading="lazy"></img>
            </div>
           </v-list-tile>
          </template>
          <v-list-tile v-if="undefined!=sect.more" @click="moreClicked(index, sindex)"><v-list-tile-content><v-list-tile-title>{{sect.more}}</v-list-tile-title></v-list-tile-content></v-list-tile>
         </v-list>
         <div class="np-grid-sect" v-else-if="undefined!=sect.items && sect.grid && sect.items.length>=sect.min">
          <template v-for="(item, iindex) in sect.items">
           <div class="np-grid-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
            <img :key="item.image" v-lazy="item.image"></img>
            <v-list-tile-title>{{item.title}}</v-list-tile-title>
            <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
            <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
             <img :src="item.emblem | emblem()" loading="lazy"></img>
            </div>
           </div>
          </template>
          <div v-if="undefined!=sect.more && undefined!=sect.items && sect.grid && sect.items.length>=sect.min" class="np-grid-more link-item" @click="moreClicked(index, sindex)">{{sect.more}}</div>
         </div>
         <div v-else-if="undefined!=sect.html" v-html="sect.html"></div>
        </template>
        <div class="np-spacer"></div>
       </v-card-text>
      </v-card>
     </v-tab-item>
    </template>
   </v-tabs>
   <v-card class="np-info-card-cover">
    <v-card-actions>
     <v-spacer></v-spacer>
     <v-btn flat icon v-if="info.sync" @click="info.sync = false" :title="trans.sync"><v-icon>link</v-icon></v-btn>
     <v-btn flat icon v-else @click="info.sync = true" :title="trans.unsync"><v-icon class="dimmed">link_off</v-icon></v-btn>
     <div style="width:32px"></div>
     <v-btn flat icon @click="trackInfo()" :title="trans.more"><img class="svg-img" :src="'more' | svgIcon(darkUi)"></img></v-btn>
     <v-spacer></v-spacer>
    </v-card-actions>
   </v-card>
  </div>
  <div v-else>
   <div v-show="overlayVolume>-1 && VOL_STD==playerStatus.dvc" id="volumeOverlay">{{overlayVolume}}%</div>
   <div v-if="landscape" v-touch:start="touchStart" v-touch:end="touchEnd" v-touch:moving="touchMoving">
    <img v-if="!info.show" :key="coverUrl" v-lazy="coverUrl" onerror="this.src='html/images/cover.png'" class="np-image-landscape" v-bind:class="{'np-image-landscape-wide': landscape && wide>1, 'np-trans':transCvr}" @contextmenu="showMenu" @click="clickImage(event)"></img>
    <div class="np-details-landscape" v-bind:class="{'np-details-landscape-wide': landscape && wide>1}">

     <div class="np-landscape-song-info hide-scrollbar fade-both">
      <div>
       <p class="np-title-landscape np-title" v-if="playerStatus.current.title">{{title}}</p>
       <p class="np-text-landscape subtext" v-if="playerStatus.current.artistAndComposer" v-html="playerStatus.current.artistAndComposer"></p>
       <p class="np-text-landscape subtext" v-if="playerStatus.current.albumLine" v-html="playerStatus.current.albumLine"></p>
      </div>
     </div>

     <v-layout text-xs-center v-if="showRatings">
      <v-flex xs12>
      <v-rating v-model="rating.value" half-increments hover clearable @click.native="setRating(true)" :readonly="undefined==ratingsPlugin"></v-rating>
      </v-flex>
     </v-layout>
     <div v-if="wide>1">

      <v-layout text-xs-center row wrap class="np-controls-wide">
       <v-flex xs12 class="np-tech ellipsis" v-if="techInfo || playerStatus.playlist.count>1">{{techInfo ? technicalInfo : ""}}{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count, techInfo ? SEPARATOR : undefined)}}</v-flex>
       <v-flex xs12 v-if="!info.show && undefined!=playerStatus.current.time">
        <v-layout class="np-time-layout">
         <p class="np-pos" v-bind:class="{'np-pos-center': playerStatus.current.duration<=0}">{{playerStatus.current.time | displayTime}}</p>
         <v-progress-linear height="5" v-if="playerStatus.current.duration>0" id="pos-slider" class="np-slider" :value="playerStatus.current.pospc" v-on:click="sliderChanged($event)" @mouseover="showTimeTooltip" @mouseout="hideTimeTooltip" @mousemove="moveTimeTooltip" @touchstart.passive="touchSliderStart" @touchend.passive="touchSliderEnd" @touchmove.passive="moveTimeTooltipTouch"></v-progress-linear>
         <p class="np-duration link-item" v-if="(showTotal || undefined==playerStatus.current.time) && playerStatus.current.duration>0" @click="toggleTime()">{{playerStatus.current.duration | displayTime}}</p>
         <p class="np-duration link-item" v-else-if="playerStatus.current.duration>0" @click="toggleTime()">-{{playerStatus.current.duration-playerStatus.current.time | displayTime}}</p>
        </v-layout>
       </v-flex>
       <v-flex xs12 v-else-if="!info.show"><div style="height:31px"></div></v-flex>
       <v-flex xs4>
        <v-layout text-xs-center>
         <v-flex xs6>
          <v-btn v-if="repAltBtn.show" :title="repAltBtn.tooltip" flat icon v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon v-if="repAltBtn.icon" class="media-icon">{{repAltBtn.icon}}</v-icon><img v-else :src="repAltBtn.image" class="btn-img"></img></v-btn>
          <v-btn :title="trans.repeatOne" flat icon v-else-if="playerStatus.playlist.repeat===1" v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon class="media-icon">repeat_one</v-icon></v-btn>
          <v-btn :title="trans.repeatAll" flat icon v-else-if="playerStatus.playlist.repeat===2" v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon class="media-icon">repeat</v-icon></v-btn>
          <v-btn :title="trans.dstm" flat icon v-else-if="dstm" v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton}"><v-icon class="media-icon">all_inclusive</v-icon></v-btn>
          <v-btn :title="trans.repeatOff" flat icon v-else v-longpress="repeatClicked" class="dimmed" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><img class="svg-img media-icon" :src="'repeat-off' | svgIcon(darkUi)"></img></v-btn>
         </v-flex>
         <v-flex xs6><v-btn flat icon v-longpress:repeat="prevButton" v-bind:class="{'np-std-button': !stopButton, 'disabled':disablePrev}"  :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn></v-flex>
        </v-layout>
       </v-flex>
       <v-flex xs4>
        <v-layout v-if="stopButton" text-xs-center>
         <v-flex xs6>
          <v-btn flat icon v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseC" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon large class="media-icon">{{playerStatus.isplaying ? 'pause' : 'play_arrow'}}</v-icon></v-btn>
         </v-flex>
         <v-flex xs6>
          <v-btn flat icon @click="doAction(['stop'])" :title="trans.stop" v-bind:class="{'disabled':disableBtns}"><v-icon large class="media-icon">stop</v-icon></v-btn>
         </v-flex>
        </v-layout>
        <v-btn flat icon large v-else v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseD" class="np-playpause" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon x-large class="media-icon">{{ playerStatus.isplaying ? 'pause_circle_outline' : 'play_circle_outline'}}</v-icon></v-btn>
       </v-flex>
       <v-flex xs4>
        <v-layout text-xs-center>
         <v-flex xs6><v-btn flat icon v-longpress:repeat="nextButton" v-bind:class="{'np-std-button': !stopButton, 'disabled':disableNext}"  :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn></v-flex>
         <v-flex xs6>
          <v-btn v-if="shuffAltBtn.show" :title="shuffAltBtn.tooltip" flat icon @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton}"><v-icon v-if="shuffAltBtn.icon" class="media-icon">{{shuffAltBtn.icon}}</v-icon><img v-else :src="shuffAltBtn.image" class="btn-img"></img></v-btn>
          <v-btn :title="trans.shuffleAlbums" flat icon v-else-if="playerStatus.playlist.shuffle===2" @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-albums' | svgIcon(darkUi)"></img></v-btn>
          <v-btn :title="trans.shuffleAll" flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon class="media-icon">shuffle</v-icon></v-btn>
          <v-btn :title="trans.shuffleOff" flat icon v-else @click="shuffleClicked" class="dimmed" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-off' | svgIcon(darkUi)"></img></v-btn>
         </v-flex>
        </v-layout>
       </v-flex>
      </v-layout>

     </div>
    </div>
   </div>
   <div v-else v-touch:start="touchStart" v-touch:end="touchEnd" v-touch:moving="touchMoving">
    <img v-if="!info.show" :key="coverUrl" v-lazy="coverUrl"  v-bind:class="{'np-trans':transCvr}" onerror="this.src='html/images/cover.png'" class="np-image" @contextmenu="showMenu" @click="clickImage(event)"></img>
    <div class="np-portrait-song-info hide-scrollbar fade-both">
     <div>
      <p class="np-title" v-if="playerStatus.current.title">{{title}}</p>
      <p class="np-text subtext" v-if="playerStatus.current.artistAndComposer" v-html="playerStatus.current.artistAndComposer"></p>
      <p class="np-text subtext" v-if="playerStatus.current.albumLine" v-html="playerStatus.current.albumLine"></p>
     </div>
    </div>
   </div>
   <v-layout text-xs-center row wrap class="np-controls" v-if="!(landscape && wide>1)">
    <v-flex xs12 v-if="showRatings && !landscape" class="np-text np-portrait-rating">
     <v-rating v-model="rating.value" half-increments hover clearable @click.native="setRating(true)" :readonly="undefined==ratingsPlugin"></v-rating>
    </v-flex>
    <v-flex xs12 class="np-tech ellipsis" v-if="techInfo || playerStatus.playlist.count>1">{{techInfo ? technicalInfo : ""}}{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count, techInfo ? SEPARATOR : undefined)}}</v-flex>

    <v-flex xs12><div class="np-portrait-thin-pad"></div></v-flex>

    <v-flex xs12 v-if="!info.show && undefined!=playerStatus.current.time">
     <v-layout>
      <p class="np-pos" v-bind:class="{'np-pos-center': playerStatus.current.duration<=0}">{{playerStatus.current.time | displayTime}}</p>
      <v-progress-linear height="5" v-if="playerStatus.current.duration>0" id="pos-slider" class="np-slider" :value="playerStatus.current.pospc" v-on:click="sliderChanged($event, false)" @mouseover="showTimeTooltip" @mouseout="hideTimeTooltip" @mousemove="moveTimeTooltip" @touchstart.passive="touchSliderStart" @touchend.passive="touchSliderEnd" @touchmove.passive="moveTimeTooltipTouch"></v-progress-linear>
      <p class="np-duration link-item" v-if="(showTotal || undefined==playerStatus.current.time) && playerStatus.current.duration>0" @click="toggleTime()">{{playerStatus.current.duration | displayTime}}</p>
      <p class="np-duration link-item" v-else-if="playerStatus.current.duration>0" @click="toggleTime()">-{{playerStatus.current.duration-playerStatus.current.time | displayTime}}</p>
     </v-layout>
    </v-flex>
    <v-flex xs12 v-else-if="!info.show"><div style="height:31px"></div></v-flex>

    <v-flex xs12><div class="np-portrait-thin-pad"></div></v-flex>

    <v-flex xs4 class="no-control-adjust">
     <v-layout text-xs-center>
      <v-flex xs6>
       <v-btn v-if="repAltBtn.show" :title="repAltBtn.tooltip" flat icon v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon v-if="repAltBtn.icon" class="media-icon">{{repAltBtn.icon}}</v-icon><img v-else :src="repAltBtn.image" class="btn-img"></img></v-btn>
       <v-btn :title="trans.repeatOne" flat icon v-else-if="playerStatus.playlist.repeat===1" v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon class="media-icon">repeat_one</v-icon></v-btn>
       <v-btn :title="trans.repeatAll" flat icon v-else-if="playerStatus.playlist.repeat===2" v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon class="media-icon">repeat</v-icon></v-btn>
       <v-btn :title="trans.dstm" flat icon v-else-if="dstm" v-longpress="repeatClicked" v-bind:class="{'np-std-button': !stopButton}"><v-icon class="media-icon">all_inclusive</v-icon></v-btn>
       <v-btn :title="trans.repeatOff" flat icon v-else v-longpress="repeatClicked" class="dimmed" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><img class="svg-img media-icon" :src="'repeat-off' | svgIcon(darkUi)"></img></v-btn>
      </v-flex>
      <v-flex xs6><v-btn flat icon v-longpress:repeat="prevButton" v-bind:class="{'np-std-button': !stopButton, 'disabled':disablePrev}"  :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn></v-flex>
     </v-layout>
    </v-flex>
    <v-flex xs4 class="no-control-adjust">
     <v-layout v-if="stopButton" text-xs-center>
      <v-flex xs6>
       <v-btn flat icon v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseE" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon large class="media-icon">{{playerStatus.isplaying ? 'pause' : 'play_arrow'}}</v-icon></v-btn>
      </v-flex>
      <v-flex xs6>
       <v-btn flat icon @click="doAction(['stop'])" :title="trans.stop" v-bind:class="{'disabled':disableBtns}"><v-icon large class="media-icon">stop</v-icon></v-btn>
      </v-flex>
     </v-layout>
     <v-btn flat icon large v-else v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseF" class="np-playpause" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon x-large class="media-icon">{{ playerStatus.isplaying ? 'pause_circle_outline' : 'play_circle_outline'}}</v-icon></v-btn>
    </v-flex>
    <v-flex xs4 class="no-control-adjust">
     <v-layout text-xs-center>
      <v-flex xs6><v-btn flat icon v-longpress:repeat="nextButton" v-bind:class="{'np-std-button': !stopButton, 'disabled':disableNext}"  :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn></v-flex>
      <v-flex xs6>
       <v-btn v-if="shuffAltBtn.show" :title="shuffAltBtn.tooltip" flat icon @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton}"><v-icon v-if="shuffAltBtn.icon" class="media-icon">{{shuffAltBtn.icon}}</v-icon><img v-else :src="shuffAltBtn.image" class="btn-img"></img></v-btn>
       <v-btn :title="trans.shuffleAlbums" flat icon v-else-if="playerStatus.playlist.shuffle===2" @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-albums' | svgIcon(darkUi)"></v-btn>
       <v-btn :title="trans.shuffleAll" flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="shuffleClicked" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><v-icon class="media-icon">shuffle</v-icon></v-btn>
       <v-btn :title="trans.shuffleOff" flat icon v-else @click="shuffleClicked" class="dimmed" v-bind:class="{'np-std-button': !stopButton,'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-off' | svgIcon(darkUi)"></img></v-btn>
      </v-flex>
     </v-layout>
    </v-flex>
   </v-layout>
  </div>
 </div>
</div>
`,
    data() {
        return { coverUrl:LMS_BLANK_COVER,
                 playerStatus: {
                    isplaying: false,
                    sleepTimer: false,
                    dvc: VOL_STD,
                    current: { canseek:1, duration:0, time:undefined, title:undefined, artist:undefined, artistAndComposer: undefined,
                               album:undefined, albumName:undefined, albumLine:undefined, technicalInfo:undefined, pospc:0.0, tracknum:undefined,
                               disc:0, year:0, url:undefined, comment:undefined, source: {local:true, text:undefined} },
                    playlist: { shuffle:0, repeat: 0, current:0, count:0 },
                 },
                 info: { show: false, tab:TRACK_TAB, showTabs:false, sync: true,
                         tabs: [ { title:undefined, text:undefined, reqId:0, image: undefined,
                                    sections:[ { title:undefined, items:[], min:1, more:undefined, grid:getLocalStorageBool("np-tabs-"+ARTIST_TAB+"-0-grid", false) },
                                               { title:undefined, html:undefined } ] },
                                 { title:undefined, text:undefined, reqId:0, image: undefined,
                                    sections:[ { title:undefined, items:[], min:2, more:undefined } ] },
                                 { title:undefined, text:undefined, reqId:0, image: undefined,
                                   sections:[ { title:undefined, html:undefined } ] } ] },
                 infoTrack: {album_id:undefined, track_id:undefined},
                 trans: { expand:undefined, collapse:undefined, sync:undefined, unsync:undefined, more:undefined, dstm:undefined,
                          repeatAll:undefined, repeatOne:undefined, repeatOff:undefined, shuffleAll:undefined, shuffleAlbums:undefined, shuffleOff:undefined,
                          play:undefined, pause:undefined, stop:undefined, prev:undefined, next:undefined },
                 showTotal: true,
                 landscape: false,
                 wide: 0,
                 largeView: false,
                 menu: { show: false, x:0, y:0, items: [], icons:false, tab:undefined, section:undefined, index:undefined },
                 rating: {value:0, setting:0},
                 timeTooltip: {show: false, x:0, y:0, text:undefined},
                 overlayVolume: -1,
                 repAltBtn:{show:false, command:[], icon:undefined, image:undefined, tooltip:undefined},
                 shuffAltBtn:{show:false, command:[], icon:undefined, image:undefined, tooltip:undefined},
                 disableBtns:true,
                 disablePrev:true,
                 disableNext:true,
                 dstm:false,
                 infoZoom:10
                };
    },
    mounted() {
        this.hideNpBar = false;
        this.desktopBottomHeight = getComputedStyle(document.documentElement).getPropertyValue('--desktop-bottom-toolbar-height');
        this.mobileBottomHeight = getComputedStyle(document.documentElement).getPropertyValue('--mobile-bottom-toolbar-height');
        this.controlDesktopNpBar();

        bus.$on('customActions', function(val) {
            this.customActions = getCustomActions("track", false);
        }.bind(this));
        this.infoZoom = parseInt(getLocalStorageVal('npInfoZoom', 10));
        if (this.infoZoom<10 | this.infoZoom>20) {
            this.infoZoom = 10;
        }

        this.info.showTabs=getLocalStorageBool("showTabs", false);
        bus.$on('expandNowPlaying', function(val) {
            if (window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT) {
                if (val) {
                    this.info.show = false;
                }
                this.largeView = val;
            }
        }.bind(this));

        bus.$on('pageChanged', function(page) {
            if (page=='now-playing') {
                if (!this.info.show) {
                    this.$forceUpdate();
                }
            }
        }.bind(this));

        bus.$on('info-swipe', function(d) {
            if (this.info.show) {
                if ('left'==d) {
                    if (this.info.tab==2) {
                        this.info.tab=0;
                    } else {
                        this.info.tab++;
                    }
                } else {
                    if (this.info.tab==0) {
                        this.info.tab=2;
                    } else {
                        this.info.tab--;
                    }
                }
            }
        }.bind(this));
        var npView = this;
        this.sizeCheckDelay = 0; // How many resize events have we seen before size checked?
        window.addEventListener('resize', () => {
            if (npView.resizeTimeout) {
                clearTimeout(npView.resizeTimeout);
            }
            npView.sizeCheckDelay++;
            if (npView.sizeCheckDelay>=10) {
                npView.checkWindowSize();
            } else {
                npView.resizeTimeout = setTimeout(function () {
                    npView.resizeTimeout = undefined;
                    npView.checkWindowSize();
                }, 50);
            }
        }, false);

        // Long-press on 'now playing' nav button whilst in now-playing shows track info
        bus.$on('nav', function(page) {
            if ('now-playing'==page) {
                if (this.$store.state.infoPlugin && this.playerStatus && this.playerStatus.current && this.playerStatus.current.artist) {
                    this.largeView = false;
                    this.info.show = !this.info.show;
                } else if (this.info.show) {
                    this.info.show = false;
                }
            }
        }.bind(this));

        this.info.sync=getLocalStorageBool("syncInfo", true);
        bus.$on('playerStatus', function(playerStatus) {
            try {
                nowplayingOnPlayerStatus(this, playerStatus); // can be called before deferred JS is loaded...
            } catch (e) { // If error, get status 1 second later...
                setTimeout(function () { bus.$emit('refreshStatus', this.$store.state.player.id); }.bind(this), 1000);
            }
        }.bind(this));

        // Refresh status now, in case we were mounted after initial status call
        bus.$emit('refreshStatus');

        this.bgndElement = document.getElementById("np-bgnd");
        this.page = document.getElementById("np-page");
        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));

        this.checkLandscape();
        setTimeout(function () {
            this.checkLandscape();
        }.bind(this), 1000);

        bus.$on('currentCover', function(coverUrl) {
            this.coverUrl = undefined==coverUrl ? LMS_BLANK_COVER : coverUrl;
            this.setBgndCover();
        }.bind(this));
        bus.$emit('getCurrentCover');

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('esc', function() {
            if (this.menu.show) {
                this.menu.show = false;
            } else if (this.$store.state.openDialogs.length==1 && this.$store.state.visibleMenus.size<=0 &&
                       this.info.show && (this.$store.state.desktopLayout || this.$store.state.page=='now-playing')) {
                this.info.show = false;
            } else if (this.$store.state.openDialogs.length==0 && this.$store.state.visibleMenus.size<=0 &&
                       this.largeView && this.$store.state.desktopLayout) {
                this.largeView = false;
            }
        }.bind(this));

        bus.$on('info', function() {
            if ((window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT && this.playerStatus.playlist.count>0) || this.info.show) {
                this.largeView = false;
                this.info.show = !this.info.show;
            }
        }.bind(this));
        bus.$on('npclose', function() {
            this.close();
        }.bind(this));

        bus.$on('prefset', function(pref, value, player) {
            if ("plugin.dontstopthemusic:provider"==pref && player==this.$store.state.player.id) {
                this.dstm = (""+value)!="0";
            }
        }.bind(this));

        bus.$on('showLinkMenu.now-playing', function(x, y, menu) {
            showMenu(this, {items: menu, x:x, y:y, show:true, icons:true});
        }.bind(this));

        this.showTotal = getLocalStorageBool('showTotal', true);
        if (!IS_MOBILE) {
            bindKey(LMS_TRACK_INFO_KEYBOARD, 'mod');
            bindKey(LMS_EXPAND_NP_KEYBOARD, 'mod+shift');
            if (undefined!=this.$store.state.ratingsPlugin) {
                for (var i=0; i<=6; ++i) {
                    bindKey(''+i, 'mod+shift');
                }
            }
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.visibleMenus.size>0 || this.$store.state.openDialogs.length>1 || (!this.$store.state.desktopLayout && this.$store.state.page!="now-playing")) {
                    return;
                }
                if ('mod'==modifier && LMS_TRACK_INFO_KEYBOARD==key && this.$store.state.infoPlugin && (this.$store.state.openDialogs.length==0 || this.$store.state.openDialogs[0]=='info-dialog') && (window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT || this.info.show)) {
                    this.largeView = false;
                    this.info.show = !this.info.show;
                } else if ('mod+shift'==modifier) {
                    if (LMS_EXPAND_NP_KEYBOARD==key && this.$store.state.desktopLayout && (window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT || this.largeView)) {
                        this.info.show = false;
                        this.largeView = !this.largeView;
                    } else if (1==key.length && !isNaN(key) && undefined!=this.$store.state.ratingsPlugin && this.$store.state.showRating) {
                        this.rating.value = parseInt(key);
                        this.setRating();
                    }
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            this.trans = { expand:i18n("Show all information"), collapse:i18n("Show information in tabs"),
                           sync:i18n("Update information when song changes"), unsync:i18n("Don't update information when song changes"),
                           more:i18n("More"), dstm:i18n("Don't Stop The Music"), repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"),
                           repeatOff:i18n("No repeat"), shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"),
                           shuffleOff:i18n("No shuffle"), play:i18n("Play"), pause:i18n("Pause"), stop:i18n("Stop"), prev:i18n("Previous track"),
                           next:i18n("Next track") };
            this.info.tabs[TRACK_TAB].title=i18n("Track");
            this.info.tabs[ARTIST_TAB].title=i18n("Artist");
            this.info.tabs[ALBUM_TAB].title=i18n("Album");
            this.info.tabs[ARTIST_TAB].sections[0].title=i18n("Albums");
            this.info.tabs[ARTIST_TAB].sections[1].title=i18n("Similar artists");
            this.info.tabs[ALBUM_TAB].sections[0].title=i18n("Tracks");
            this.info.tabs[TRACK_TAB].sections[0].title=i18n("Details");
        },
        showContextMenu(event) {
            if (this.$store.state.visibleMenus.size<1) {
                this.showMenu(event);
            } else {
                event.preventDefault();
            }
        },
        showMenu(event) {
            nowplayingShowMenu(this, event);
        },
        menuAction(item) {
            nowplayingMenuAction(this, item);
        },
        showPic() {
            bus.$emit('dlg.open', 'gallery', [this.coverUrl], 0, true);
        },
        doAction(command) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', command);
        },
        setPosition() {
            var pc = this.playerStatus.current && undefined!=this.playerStatus.current.time && undefined!=this.playerStatus.current.duration &&
                     this.playerStatus.current.duration>0 ? 100*Math.floor(this.playerStatus.current.time*1000/this.playerStatus.current.duration)/1000 : 0.0;

            if (pc!=this.playerStatus.current.pospc) {
                this.playerStatus.current.pospc = pc;
            }
        },
        sliderChanged(e, isTouch) {
            if (this.playerStatus.current.canseek && this.playerStatus.current.duration>3) {
                const rect = document.getElementById("pos-slider").getBoundingClientRect();
                const evPos = isTouch ? getTouchPos(e) : {x:e.clientX, y:e.clientY};
                let pos = evPos.x - rect.x;
                if (isTouch && ( (evPos.x < (rect.x - 8)) || (evPos.x > (rect.x+rect.width + 8)) ||
                                 (evPos.y < (rect.y - 8)) || (evPos.y > (rect.y+rect.height + 8))) ) {
                    return;
                }
                // Try to detect up-swipes on desktop layout on mobile devices, e.g. newer Android where swipe up to
                // show navigation bar.
                if (isTouch && this.$store.state.desktopLayout && !this.largeView && undefined!=this.touchStartPos &&
                    (window.innerHeight-8)<=this.touchStartPos.y && this.touchStartPos.y>evPos.y && (this.touchStartPos.y-evPos.y)>4) {
                    return;
                }
                pos = Math.min(Math.max(0, pos), rect.width);
                let val = Math.floor(this.playerStatus.current.duration * pos / rect.width);

                // On touch devices we get a sliderChanged event from touchSliderEnd and the one from the slider
                // So, ignore events too close together. See #672
                if (undefined!=this.lastTimeEvent && this.lastTimeEvent.isTouch!=isTouch && this.lastTimeEvent.val==val && ((new Date().getTime())-this.lastTimeEvent.time)<250) {
                    return;
                }
                this.doAction(['time', val]);
                this.lastTimeEvent = {time: new Date().getTime(), val: val, isTouch: isTouch};
            }
        },
        moveTimeTooltipTouch(e) {
            this.moveTimeTooltip(getTouchPos(e), true);
        },
        moveTimeTooltip(e, isTouch) {
            if (this.timeTooltip.show) {
                if (this.playerStatus.current.duration<=1) {
                    this.hideTimeTooltip();
                    return;
                }
                this.timeTooltip.x = e.x
                const rect = document.getElementById("pos-slider").getBoundingClientRect();
                this.timeTooltip.y = rect.y - (isTouch ? 32 : 0);
                let pos = e.x - rect.x;
                pos = Math.min(Math.max(0, pos), rect.width);
                this.timeTooltip.text=""+formatSeconds(Math.floor(this.playerStatus.current.duration * pos / rect.width));
                this.startTooltipTimeout();
            }
        },
        touchSliderStart(e) {
            this.showTimeTooltip();
            this.touchStartPos = getTouchPos(e);
        },
        touchSliderEnd(e) {
            if (this.timeTooltip.show) {
                this.sliderChanged(e, true);
                this.hideTimeTooltip();
            }
            this.touchStartPos = undefined;
        },
        setInfoTrack() {
            this.infoTrack={ title: this.playerStatus.current.title,
                             track_id: this.playerStatus.current.id,
                             artist: this.playerStatus.current.artist,
                             artist_id: this.playerStatus.current.artist_ids
                                ? this.playerStatus.current.artist_ids[0]
                                : this.playerStatus.current.artist_id,
                             artist_ids: this.playerStatus.current.artist_ids,
                             albumartist: this.playerStatus.current.albumartist,
                             albumartist_ids: this.playerStatus.current.albumartist_ids,
                             album: this.playerStatus.current.albumName, album_id: this.playerStatus.current.album_id };
            this.infoTrack.empty=undefined==this.infoTrack.title &&
                                 undefined==this.infoTrack.track_id &&
                                 undefined==this.infoTrack.artist &&
                                 undefined==this.infoTrack.artist_id &&
                                 undefined==this.infoTrack.artist_ids &&
                                 undefined==this.infoTrack.albumartist &&
                                 undefined==this.infoTrack.albumartist_ids &&
                                 undefined==this.infoTrack.album;
        },
        trackInfo() {
            if (undefined==this.playerStatus.current.id) {
                bus.$emit('showMessage', i18n('Nothing playing'));
                return;
            }
            this.close();
            bus.$emit('trackInfo', {id: "track_id:"+this.playerStatus.current.id, title:this.playerStatus.current.title, image: this.coverUrl},
                      this.playerStatus.playlist.current, NP_INFO);
        },
        fetchTrackInfo() {
            nowplayingFetchTrackInfo(this);
        },
        fetchArtistInfo() {
            nowplayingFetchArtistInfo(this);
        },
        fetchAlbumInfo() {
            nowplayingFetchAlbumInfo(this);
        },
        isCurrent(data, tab) {
            return data.id==this.info.tabs[tab].reqId;
        },
        showInfo() {
            if (!this.info.show || !this.infoTrack) {
                return;
            }
            if (this.$store.state.desktopLayout && !this.showTabs) {
                this.fetchTrackInfo();
                this.fetchArtistInfo();
                this.fetchAlbumInfo();
            } else if (TRACK_TAB==this.info.tab) {
                this.fetchTrackInfo();
            } else if (ARTIST_TAB==this.info.tab) {
                this.fetchArtistInfo();
            } else {
                this.fetchAlbumInfo();
            }
        },
        close() {
            if (this.$store.state.desktopLayout) {
                this.info.show=false;
                this.largeView=false;
            }
        },
        startPositionInterval() {
            this.stopPositionInterval();
            this.positionInterval = setInterval(function () {
                if (undefined!=this.playerStatus.current.time && this.playerStatus.current.time>=0) {
                    var current = new Date();
                    var diff = (current.getTime()-this.playerStatus.current.updated.getTime())/1000.0;
                    this.playerStatus.current.time = this.playerStatus.current.origTime + diff;
                    currentPlayingTrackPosition = this.playerStatus.current.time;
                    this.setPosition();
                    if (this.playerStatus.current.duration && this.playerStatus.current.duration>0 &&
                        this.playerStatus.current.time>=(this.playerStatus.current.duration+2)) {
                        bus.$emit('refreshStatus');
                    }
                }
            }.bind(this), 1000);
        },
        stopPositionInterval() {
            if (undefined!==this.positionInterval) {
                clearInterval(this.positionInterval);
                this.positionInterval = undefined;
            }
        },
        toggleTime() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            this.showTotal = !this.showTotal;
            setLocalStorageVal("showTotal", this.showTotal);
        },
        setBgndCover() {
            setBgndCover(this.bgndElement, this.coverUrl);
        },
        playPauseButton(showSleepMenu) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (showSleepMenu) {
                bus.$emit('dlg.open', 'sleep', this.$store.state.player);
            } else {
                this.doAction([this.playerStatus.isplaying ? 'pause' : 'play']);
            }
        },
        prevButton(skip) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (!this.disablePrev) {
                if (skip && this.playerStatus.current.time>=this.$store.state.skipSeconds) {
                    this.doAction(['time', this.playerStatus.current.time-this.$store.state.skipSeconds]);
                } else {
                    this.doAction(['button', 'jump_rew']);
                }
            }
        },
        nextButton(skip) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (!this.disableNext) {
                if (skip && (this.playerStatus.current.time+this.$store.state.skipSeconds)<this.playerStatus.current.duration) {
                    this.doAction(['time', this.playerStatus.current.time+this.$store.state.skipSeconds]);
                } else {
                    this.doAction(['playlist', 'index', '+1']);
                }
            }
        },
        shuffleClicked() {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (this.shuffAltBtn.show) {
                this.doCommand(this.shuffAltBtn.command, this.shuffAltBtn.tooltip);
            } else if (this.playerStatus.playlist.shuffle===2) {
                this.doAction(['playlist', 'shuffle', 0]);
            } else if (this.playerStatus.playlist.shuffle===1) {
                this.doAction(['playlist', 'shuffle', 2]);
            } else {
                this.doAction(['playlist', 'shuffle', 1]);
            }
        },
        repeatClicked(longPress) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (this.repAltBtn.show) {
                this.doCommand(this.repAltBtn.command, this.repAltBtn.tooltip);
            } else {
                if (this.playerStatus.playlist.repeat===0) {
                    if (this.$store.state.dstmPlugin) {
                        if (longPress) {
                            bus.$emit('dlg.open', 'dstm');
                        } else if (this.dstm) {
                            lmsCommand(this.$store.state.player.id, ["material-skin-client", "save-dstm"]).then(({data}) => {
                                bus.$emit("dstm", this.$store.state.player.id, 0);
                            });
                        } else {
                            bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
                        }
                    } else {
                        bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
                    }
                } else if (this.playerStatus.playlist.repeat===1) {
                    bus.$emit('playerCommand', ['playlist', 'repeat', 0]);
                } else if (this.playerStatus.playlist.repeat===2) {
                    bus.$emit('playerCommand', ['playlist', 'repeat', 1]);
                    if (this.$store.state.dstmPlugin) {
                        lmsCommand(this.$store.state.player.id, ["material-skin-client", "get-dstm"]).then(({data}) => {
                            if (data && data.result && undefined!=data.result.provider) {
                                bus.$emit("dstm", this.$store.state.player.id, data.result.provider);
                            }
                        });
                    }
                }
            }
        },
        showSleep() {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            bus.$emit('dlg.open', 'sleep', this.$store.state.player);
        },
        setRating(allowReset) {
            var val = allowReset && this.rating.value==this.rating.setting && this.rating.value<=1 ? 0 : this.rating.value;
            // this.rating.value is updated *before* this setRating click handler is called, so we can use its model value to update LMS
            this.rating.track_id = this.playerStatus.current.id;
            this.rating.album_id = this.playerStatus.current.album_id;
            lmsCommand(this.$store.state.player.id, [this.$store.state.ratingsPlugin, "setrating", this.playerStatus.current.id, val]).then(({data}) => {
                if (allowReset && this.rating.track_id==this.playerStatus.current.id) {
                    this.rating.value=val;
                }
                logJsonMessage("RESP", data);
                bus.$emit('refreshStatus');
                bus.$emit('ratingChanged', this.rating.track_id, this.rating.album_id);
            });
        },
        doCommand(command, msg) {
            lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                if (undefined!=msg) {
                    bus.$emit('showMessage', msg);
                }
            });
        },
        clickImage(event) {
            if (this.menu.show) {
                this.menu.show = false;
                return;
            }
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (!this.clickTimer) {
                this.clickTimer = setTimeout(function () {
                    this.clearClickTimeout();
                    if (IS_IOS) {
                        this.showMenu(event);
                    } else {
                        bus.$emit('expandNowPlaying', true);
                    }
                }.bind(this), LMS_DOUBLE_CLICK_TIMEOUT);
            } else {
                this.clearClickTimeout(this.clickTimer);
                this.showPic();
            }
        },
        clearClickTimeout() {
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
                this.clickTimer = undefined;
            }
        },
        touchStart(event) {
            if (event.srcElement.classList.contains("np-title") || event.srcElement.classList.contains("np-text") || event.srcElement.classList.contains("np-text-landscape")) {
                return;
            }
            if (this.$store.state.swipeVolume && !this.menu.show && event.touches && event.touches.length>0 && VOL_STD==this.playerStatus.dvc) {
                this.touch={x:event.touches[0].clientX, y:event.touches[0].clientY, moving:false};
                this.lastSentVolume=-1;
            }
        },
        touchEnd() {
            if (this.touch && this.touch.moving && this.overlayVolume>=0 && this.overlayVolume!=this.lastSentVolume && VOL_STD==this.playerStatus.dvc) {
                bus.$emit('playerCommand', ["mixer", "volume", this.overlayVolume]);
            }
            this.touch=undefined;
            this.overlayVolume=-1;
            this.lastSentVolume=-1;
            this.cancelSendVolumeTimer();
        },
        touchMoving(event) {
            if (undefined!=this.touch && VOL_STD==this.playerStatus.dvc) {
                if (Math.abs(event.touches[0].clientX-this.touch.x)<48) {
                    if (!this.touch.moving && Math.abs(event.touches[0].clientY-this.touch.y)>10) {
                        this.touch.moving=true;
                        this.overlayVolume=Math.abs(this.volume);
                        this.lastSentVolume=this.overlayVolume;
                    }
                    const VOL_STEP_PX = 25;
                    if (Math.abs(event.touches[0].clientY-this.touch.y)>=VOL_STEP_PX) {
                        var steps = Math.floor(Math.abs(event.touches[0].clientY-this.touch.y) / VOL_STEP_PX);
                        if (steps>0) {
                            var inc = event.touches[0].clientY<this.touch.y;
                            for (var i=0; i<steps; ++i) {
                                this.overlayVolume = adjustVolume(Math.abs(this.overlayVolume), inc);
                                if (this.overlayVolume<0) {
                                    this.overlayVolume=0;
                                    break;
                                } else if (this.overlayVolume>100) {
                                    this.overlayVolume=100;
                                    break;
                                }
                            }
                            this.touch.y += steps*VOL_STEP_PX*(inc ? -1 : 1);
                            this.resetSendVolumeTimer();
                        }
                    }
                }
            }
        },
        cancelSendVolumeTimer() {
            if (undefined!==this.sendVolumeTimer) {
                clearTimeout(this.sendVolumeTimer);
                this.sendVolumeTimer = undefined;
            }
        },
        resetSendVolumeTimer() {
            this.cancelSendVolumeTimer();
            this.sendVolumeTimer = setTimeout(function () {
                if (this.overlayVolume!=this.lastSentVolume) {
                    bus.$emit('playerCommand', ["mixer", "volume", this.overlayVolume]);
                    this.lastSentVolume=this.overlayVolume;
                }
            }.bind(this), LMS_VOLUME_DEBOUNCE);
        },
        adjustFont(sz) {
            this.infoZoom=sz;
            getLocalStorageVal('npInfoZoom', sz);
        },
        checkWindowSize() {
            this.checkLandscape();
            this.sizeCheckDelay = 0;
            if (window.innerHeight<LMS_MIN_NP_LARGE_INFO_HEIGHT) {
                this.largeView = false;
                this.info.show = false;
            }
        },
        checkLandscape() {
            this.landscape = window.innerWidth >= (window.innerHeight*queryParams.npRatio);
            // wide=0 => controls under whole width
            // wide=2 => controls under text only
            this.wide = window.innerWidth>=600 && ((window.innerWidth>=1800) || (window.innerWidth/2.0)>=(window.innerHeight*0.75)) ? 2 /*: window.innerHeight>340 ? 1*/ : 0;
        },
        itemClicked(tab, section, index, event) {
            nowplayingItemClicked(this, tab, section, index, event);
        },
        moreClicked(tab, section) {
            nowplayingMoreClicked(this, tab, section);
        },
        toggleGrid(tab, section) {
            nowplayingToggleGrid(this, tab, section);
        },
        controlDesktopNpBar() {
            let hideNpBar = this.disableBtns && this.$store.state.desktopLayout;
            if (hideNpBar!=this.hideNpBar) {
                this.hideNpBar = hideNpBar;
                document.documentElement.style.setProperty('--bottom-toolbar-height',
                    hideNpBar ? '0px' : this.$store.state.desktopLayout ? this.desktopBottomHeight : this.mobileBottomHeight);
            }
        },
        showTimeTooltip() {
            this.startTooltipTimeout();
            this.timeTooltip.show = true;
        },
        hideTimeTooltip() {
            this.timeTooltip.show = false;
            this.cancelTooltipTimeout();
        },
        startTooltipTimeout() {
            this.cancelTooltipTimeout();
            this.timeTooltip.timeout = setTimeout(function () {
                this.hideTimeTooltip();
            }.bind(this), 2000);
        },
        cancelTooltipTimeout() {
            if (undefined!==this.timeTooltip.timeout) {
                clearTimeout(this.timeTooltip.timeout);
                this.timeTooltip.timeout = undefined;
            }
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value || value<0) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        },
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        emblem: function (e) {
            return "/material/svg/"+e.name+"?c="+e.color.substr(1)+"&r="+LMS_MATERIAL_REVISION;
        },
        limitStr: function(str) {
            if (undefined==str || str.length<80) {
                return str;
            }
            return str.substring(0, 80) + "\u2026";
        },
        trackCount(current, total, sep) {
            if (undefined==current || undefined==total || total<2) {
                return "";
            }
            return (undefined==sep ? "" : sep)+i18n("%1 of %2", (current+1), total);
        },
        tooltip: function (str, key, showShortcut) {
            return showShortcut && undefined!=key ? ttShortcutStr(str, key, false, true) : str;
        }
    },
    watch: {
        'info.show': function(val) {
            // Indicate that dialog is/isn't shown, so that swipe is controlled
            bus.$emit('infoDialog', val);
            this.$store.commit('dialogOpen', {name:'info-dialog', shown:val});
            this.setInfoTrack();
            this.showInfo();
        },
        'info.tab': function(tab) {
            this.showInfo();
        },
        'info.showTabs': function() {
            setLocalStorageVal("showTabs", this.info.showTabs);
        },
        'info.sync': function() {
            setLocalStorageVal("syncInfo", this.info.sync);
            if (this.info.sync) {
                this.setInfoTrack();
                this.showInfo();
            }
        },
        'largeView': function(val) {
            if (val) {
                // Save current style so can reset when largeview disabled
                if (!this.before) {
                    var elem = document.getElementById("np-bar");
                    if (elem) {
                        this.before = elem.style;
                    }
                }
                this.$nextTick(function () {
                    this.page = document.getElementById("np-page");
                });
            } else {
                if (this.before) {
                    this.$nextTick(function () {
                        var elem = document.getElementById("np-bar");
                        if (elem) {
                            elem.style = this.before;
                        }
                    });
                }
                this.page = undefined;
            }
            bus.$emit('nowPlayingExpanded', val);
        },
        'menu.show': function(newVal) {
            this.$store.commit('menuVisible', {name:'nowplaying', shown:newVal});
        },
        'disableBtns': function(newVal) {
            this.controlDesktopNpBar();
        },
        '$store.state.desktopLayout': function(newVal) {
            this.controlDesktopNpBar();
        }
    },
    computed: {
        infoPlugin() {
            return this.$store.state.infoPlugin
        },
        stopButton() {
            return this.$store.state.stopButton
        },
        techInfo() {
            return this.$store.state.techInfo &&
                   ( !this.$store.state.desktopLayout || this.largeView || this.$store.state.fontSize!='l' || !this.showRatings) &&
                   ( (!this.repAltBtn.show && !this.shuffAltBtn.show) || !this.$store.state.desktopLayout || this.largeView )
        },
        technicalInfo() {
            return undefined==this.playerStatus.current.technicalInfo || this.playerStatus.current.length==0
                ? undefined
                : undefined==this.playerStatus.current.source || this.playerStatus.current.source.other || undefined==this.playerStatus.current.source.text || this.playerStatus.current.source.text.length<1
                    ? this.playerStatus.current.technicalInfo
                    : (this.playerStatus.current.source.text+SEPARATOR+this.playerStatus.current.technicalInfo);
        },
        formattedTime() {
            return this.playerStatus && this.playerStatus.current
                        ? !this.showTotal && undefined!=this.playerStatus.current.time && this.playerStatus.current.duration>0
                            ? formatSeconds(Math.floor(this.playerStatus.current.time))+" / -"+
                              formatSeconds(Math.floor(this.playerStatus.current.duration-this.playerStatus.current.time))
                            : (undefined!=this.playerStatus.current.time ? formatSeconds(Math.floor(this.playerStatus.current.time)) : "") +
                              (undefined!=this.playerStatus.current.time && this.playerStatus.current.duration>0 ? " / " : "") +
                              (this.playerStatus.current.duration>0 ? formatSeconds(Math.floor(this.playerStatus.current.duration)) : "")
                        : undefined;
        },
        darkUi() {
            return this.$store.state.darkUi
        },
        ratingsPlugin() {
            return this.$store.state.ratingsPlugin
        },
        npBarRatings() {
            if (!this.playerStatus || !this.playerStatus.current) {
                return false;
            }
            if (this.repAltBtn.show || this.shuffAltBtn.show) {
                return true; // Use same space for these...
            }
            return this.showRatings;
        },
        showRatings() {
            return this.$store.state.showRating && this.playerStatus && this.playerStatus.current &&
                   this.playerStatus.current.duration && this.playerStatus.current.duration>0 && undefined!=this.playerStatus.current.id &&
                   !(""+this.playerStatus.current.id).startsWith("-");
        },
        maxRating() {
            return this.$store.state.maxRating
        },
        title() {
            if (this.$store.state.nowPlayingTrackNum && this.playerStatus.current.tracknum) {
                return formatTrackNum(this.playerStatus.current)+SEPARATOR+this.playerStatus.current.title;
            }
            return this.playerStatus.current.title;
        },
        zoomInfoClass() {
            return "np-info-text-"+this.infoZoom;
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        noPlayer() {
            return !this.$store.state.player
        },
        drawBgndImage() {
            return this.$store.state.nowPlayingBackdrop && undefined!=this.coverUrl && LMS_BLANK_COVER!=this.coverUrl
        },
        drawInfoBgndImage() {
            return this.$store.state.infoBackdrop && undefined!=this.coverUrl && LMS_BLANK_COVER!=this.coverUrl
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        transCvr() {
            return undefined!=this.coverUrl && this.coverUrl.endsWith(DEFAULT_COVER)
        }
    },
    beforeDestroy() {
        this.stopPositionInterval();
        this.clearClickTimeout();
        this.cancelTooltipTimeout();
    }
});
