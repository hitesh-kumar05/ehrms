exports.isLastDateExceededQueryParamObj = (user_id) => {
    let q = `SELECT u.user_id, 
    max(if(a.key = 2, a.value, (SELECT value FROM app_configuration WHERE id=2))) AS registration_last_date,
     Max(if(a.key = 3, a.value, (SELECT value FROM app_configuration WHERE id=3))) AS carry_last_date,
      max(if(a.key = 4, a.value, (SELECT value FROM app_configuration WHERE id=4))) AS edit_last_date,
       max(if(a.key = 5, a.value, (SELECT value FROM app_configuration WHERE id=5))) AS ganna_last_date,
     NOW() AS today
    from users u
INNER JOIN mas_user_type mu
ON mu.usertype = u.usertype
LEFT JOIN app_configuration_special a ON a.user_id = u.user_id AND a.is_active = 1
WHERE u.user_id = ?
GROUP BY a.user_id`
    let p = [user_id]
    return { query: q, params: p }
}

