exports.getNotificationQueryParamObj = ()=>{
    return ({query:'select * from notification n where n.is_active =1',params:[]})
}