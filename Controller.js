const puppeteer = require('puppeteer'); //크롤링 라이브러리
const cheerio = require('cheerio');     //크롤링 데이터 파싱 라이브러리
const config = require('./Config.js');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;   //JsonToCSV 라이브러리 

class Controller{
    
    /** 생성자
    avgRateList : json 형태의 평균 금리 데이터 저장 리스트
    rawDataList : json 형태의 금리 데이터 저장 리스트
    yearList : 데이터 수집 년도 리스트
    monthList : 데이터 수집 달 리스트
    today : 수집 breaking 하기 위한 변수   
     */
    constructor () {
        this.avgRateList = new Array();
        this.rawDataList = new Array();
        this.yearList = ['2016','2017','2018','2019','2020','2021','2022','2023'];
        this.monthList = ['01','02','03','04','05','06','07','08','09','10','11','12'];
        this.today = new Date();

    }

    /**
     * RunProcess() : SPA 크롤링 데이터 수집 및 파싱 
     * 상세설명 : 년도, 월, 일 마다 금리 데이터 수집 및 파싱 , 조회 날짜가 오늘 날짜보다 미래이면 수집 종료 
     * for 문안에 _page 생성과 종료를 넣은 이유 : SPA 특성상 태그의 변화없이 데이터만 업데이트 되는데 pupeteer의 waitForSelector()이나 waitForTimeout()으로는 한계가 있음.
     * 그래서 페이지를 새로 열고 waitForSelector()를 이용해 페이지 렌더링 감지
     */
    async RunProcess() {
        try {
            outerFor : for (var _year of this.yearList) {
                for (var _month of this.monthList) {
                    let _dayList = [];
                    _dayList = this.GetDaysList(_year,_month);
                    for (var _day of _dayList) {
                        const _browser = await puppeteer.launch({
                            //    headless: false    // 크롤링할 때 사이트 노출 여부
                                headless: true    
                            });

                        const _page = await _browser.newPage();

                        await _page.setViewport({   // 페이지 크기 설정
                            width: config.width,
                            height: config.height
                        });

                        await _page.goto(config.url);   

                        // pupeteer select() : SPA 페이지 데이터를 조회하기 위해 
                        // Input value 설정하는 것. _month 입력 시 _day 목록 자동 업데이트 됨.
                        await _page.select('select#selectYear',_year);
                        await _page.select('select#selectMonth',_month);
                        await _page.select('select#selectDay',_day);
                        console.log("조회할 날짜 : " + _year + "." + _month + "." + _day);

                        let _selectDay = new Date(_year + '-' + _month + '-' + _day);
                        if(_selectDay > this.today){    
                            // 현재 날짜 데이터 까지만 수집
                            await this.JsonToCSV(["금리조회일","은행명","6단리","12단리","24단리","36단리","6복리","12복리","24복리","36복리","비교 공시일"],this.rawDataList,"./"+ _year.toString() +"rawData.csv");
                            await this.JsonToCSV(["금리조회일","예금종류","6","12","18","24"],this.avgRateList,"./"+ _year.toString() +"avgData.csv");
                            console.log("데이터 수집 끝.");
                            break outerFor;
                        };
                        await this.Request(_page,_browser);
                        await _page.close();
                        await _browser.close();
                    }
                }
                await this.JsonToCSV(["금리조회일","은행명","6단리","12단리","24단리","36단리","6복리","12복리","24복리","36복리","비교 공시일"],this.rawDataList,"./"+ _year.toString() +"rawData.csv");
                await this.JsonToCSV(["금리조회일","예금종류","6","12","18","24"],this.avgRateList,"./"+ _year.toString() +"avgData.csv");
                this.rawDataList = [];
                this.avgRateList = [];
                // 리스트 클리어 
            }
        } catch (_err) {
            console.log("RunProcess() Error : " + _err);
        }
    }

    /**
     * 하루 일자 데이터 테스트용 
     */
    async RunProcess_v1() {
        try {
            const _year = '2017';
            const _month = '01';
            const _day = '29';
            
            const _browser = await puppeteer.launch({
                headless: false    // 크롤링할 때 사이트 노출 여부
            //    headless: true    
            });
            const _page = await _browser.newPage();

            await _page.setViewport({
                width: 1920,
                height: 1080
              });

            await _page.goto(config.url);    
            
            const _content = await _page.content();
            const $ = cheerio.load(_content);
            
            await _page.select('select#selectYear',_year);
            await _page.select('select#selectMonth',_month);
            await _page.select('select#selectDay',_day);
            
            // _page.select() 와 공통점 : 페이지 Input 값 설정 가능
            // 차이점 : select()는 값 설정 시 이벤트가 발생하여 ex) month : 2 로 입력 시 Day 목록 : 28까지 업데이트 되지만 InputValue는 이벤트 발생 x 
            // 그래서 2월 달 데이터 수집 후 3월 수집 시 Day 목록이 28이라서 3월 29 ~ 31 데이터 수집 불가
            /*
            await this.InputValue(_page,'select#selectYear',_year);
            await this.InputValue(_page,'select#selectMonth',_month);
            await this.InputValue(_page,'select#selectDay',_day);
              */

            await this.Request(_page);
            await _page.close();
            await _browser.close();
        } catch (_err) {
            console.log("RunProcess() Error : " + _err);
        }
    }
    
    /**
     * 입력값 설정 후 클릭, 페이지 렌더링 대기 후 크롤링 데이터 파싱   
     */
    async Request(_page,_browser) {
        try {
            await _page.click('button#searchBtn');

            // 시간 초과 시 catch문으로 떨어져 밑의 코드 실행은 안됨.
            await _page.waitForSelector('#depoTbody > tr:nth-child(1) > td.table-detail', {timeout : 5000, visible : true});
            //await _page.waitForTimeout(5000);

            let _updateContent = await _page.content();
            let $_updateContent = cheerio.load(_updateContent);
            let _date = $_updateContent('#viewDate').text();
            console.log("금리 조회일 : " + _date + " 데이터 수집 완료");
            
            await this.ParsingAvgRate($_updateContent,_date);
            await this.ParsingRawData($_updateContent,_date);
        } catch (_err) {
            console.log("Request() Error : " + _err);
            await _page.close();
            await _browser.close();
        }
    }

    /**
     * Json 형태의 데이터를 CSV 로 전환 
     * 데이터 인코딩 : utf-8
     * @param {*} _headerList : csv header List
     * @param {*} _dataList : json 형태의 데이터
     * @param {*} _path : 파일 저장 경로
     */
    async JsonToCSV(_headerList,_dataList,_path) {
        try {
            const csvWriter = createCsvWriter({
                path : _path,
                header : _headerList.map((item) => ({id : item, title : item})),
            });

            await csvWriter.writeRecords(_dataList).then(() => {
                console.log(_path +' csv 파일 저장 성공');
            });
        } catch (_err) {
            console.log("JsonToCSV Error : " + _err);
        }
    }

    /**
     * 평균 금리 데이터 파싱
     * @param {*} $ 
     * @param {*} _rateDateStr 
     */
    async ParsingAvgRate($,_rateDateStr) {
        try {
            let $_data = $('#_FSBcontainer > div.js-content-zoom-wrap > div > div:nth-child(5) > div > table > tbody > tr:nth-child(2)').children();
            let _monthTypeList = ['6','12','18','24'];
            let _dictObject = {};
            _dictObject['금리조회일'] = _rateDateStr;
            _dictObject['예금종류'] = '정기예금';

            await $_data.each(function(index,elem) {
                let _rateStr = $(elem).text();
                _dictObject[_monthTypeList[index]] = _rateStr;
            });
            this.avgRateList.push(_dictObject);
            //console.log(this.avgRateList);
        } catch (_err) {
            console.log("ParsingAvgRate() Error : " + _err);
        } 
        
    }

    /**
     * 금리 데이터 파싱
     * @param {*} $ 
     * @param {*} _date 
     */
    async ParsingRawData($,_date) {
        try {
            $('#depoTbody').children('.tr-info').remove();
            let $_data = $('#depoTbody').children();
            let _localList = [];
            await $_data.each(function(index,elem) { //멤버변수 접근 불가 , 해결방안 : 파라미터로 넘겨주거나 이 함수 내에 지역변수를 참조해서 사용
                let _dictObject = new Object();
                _dictObject = {
                    "금리조회일" : _date,
                    "은행명" : $(elem).find('.chk-label').text(),
                    "6단리" : $(elem).find('td:nth-child(2)').text(),
                    "12단리" : $(elem).find('td:nth-child(3)').text(),
                    '24단리' : $(elem).find('td:nth-child(4)').text(),
                    '36단리' : $(elem).find('td:nth-child(5)').text(),
                    '6복리' : $(elem).find('td:nth-child(6)').text(),
                    '12복리' : $(elem).find('td:nth-child(7)').text(),
                    '24복리' : $(elem).find('td:nth-child(8)').text(),
                    '36복리' : $(elem).find('td:nth-child(9)').text(),
                    '비교 공시일' : $(elem).find('td:nth-child(10)').text()
                };
                _localList.push(_dictObject);
            });

            this.rawDataList.push(..._localList);
            //console.log("array : " + this.rawDataList[0]);
            //console.log("array  len : " + this.rawDataList.length);
        } catch (_err) {
            console.log("ParsingRawData() Error : " + _err);
        }
    }

    /**
     * 페이지 Input값 설정 함수 (현재 쓰이지 않음.)
     * @param {*} _page 
     * @param {*} _selector 
     * @param {*} _value 
     */
    async InputValue(_page,_selector,_value) {
        try {
            await _page.evaluate((_selector,_value) => {
                document.querySelector(_selector).value = _value;
            },_selector,_value);
        } catch (_err) {
            console.log("InputValue Error : " + _selector + " : " + _err);
        }
    }

    /**
     * 해당 년도, 월의 일 정보 리스트 반환 값 . 페이지 특성 상 10일 이하는 ex) 01,02 .. 로 만들기 위함.
     * 윤년도 계산 가능 ex) 윤년인 경우 366일
     * @param {*} year 
     * @param {*} month 
     * @returns 
     */
    GetDaysList(year,month) {
        try {
            let _daysList = new Array();
            let _lastDay =  32 - new Date(year, month-1, 32).getDate();
            for (var i = 1; i <= _lastDay; i++) {
                if(i < 10)
                {
                    _daysList.push('0'+ i.toString());
                }
                else
                {
                    _daysList.push(i.toString());
                }
            }
            return _daysList;
        } catch (_err) {
            console.log("" + _err);
        }
    }

    /*
      // 홈페이지 입력창 Day 드롭다운메뉴 목록조회 , (메소드 테스트 필요)
    // ex) 
    async GetInputDataParsing(_page,_seloctor) {
        try {
            const _list = [];
            const _content = await _page.content();
            const $ = cheerio.load(_content);
            const $_days = $(_seloctor).children();
            $_days.each(function(i,_node) {
                _list[i] = $(_node).val();
            });
            _list.sort();
            console.log("list : " + _list);
            return _list;
        } catch (_err) {
            console.log("GetInputDataParsing() " + _strKeyword + " Error : " + _err);
            return null;
        }
    }
    */

}

const start = new Controller();
start.RunProcess();